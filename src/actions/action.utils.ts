import moment, { Moment, Duration, duration } from "moment";
import { config } from "../config";
import { DBState, NormalizedDayKey, RawEntrySuffix } from "./db";
import { Brand } from "../util-types";
import { DB_DAY_FORMAT, TIME_FORMAT } from "../consts";

import colors from "colors";
export type TimeInput = Brand<string, "TimeInput">; // format like '03:00' or '9:23'  see consts.TIME_FORMAT
export type DayInput = Brand<string, "DayInput">; // formats like '2022-11-23' or '23.11' or '23.11.2022' or "~2" for the day before yesterday???
export type DurationString = Brand<string, "DurationString">; // format 40:22
export type ParsedEntry = {
  name: string;
  from: TimeInput;
  to: TimeInput;
  duration: string;
  toNow?: string;
  durationNow?: string;
};

export const formatDuration = (
  duration: Duration,
  opts?: { signed: boolean },
): DurationString => {
  const { signed = false } = opts || {};
  if (duration.asMinutes() >= 0) {
    const hours = Math.floor(duration.asMinutes() / 60);
    const minutes = duration.asMinutes() % 60;
    return `${signed ? " " : ""}${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}` as DurationString;
  } else {
    const hours = Math.floor(-duration.asMinutes() / 60);
    const minutes = -duration.asMinutes() % 60;
    return `${signed ? "-" : ""}${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}` as DurationString;
  }
};

export const formatDurationAsNumber = (duration: Duration): string => {
  return (Math.round(duration.asHours() * 100) / 100)
    .toString(10)
    .replace(".", config.decimalSeparator);
};

const calcDuration = (from: TimeInput, to: TimeInput) => {
  const duration = moment.duration(
    moment(to, "HH:mm").diff(moment(from, "HH:mm")),
  );
  return formatDuration(duration);
};

export const sumDuration = (entries: ParsedEntry[]) => {
  const durationSum = entries
    .map((_) => _.duration || _.durationNow)
    .filter(Boolean)
    .map((_) => moment.duration(_)) // "HH:mm" durations, https://momentjs.com/docs/#/durations/creating/
    .reduce((sum, current) => {
      return sum.add(current);
    }, moment.duration(0));
  return durationSum;
};

export const parseEntries = (
  state: DBState,
  currentMoment: Moment,
): ParsedEntry[] => {
  const currentDay = currentMoment.format(DB_DAY_FORMAT) as NormalizedDayKey;
  const currentTime = currentMoment.format(TIME_FORMAT) as TimeInput;
  const rawEntries = getRawEntries(state, currentDay);
  const entries: ParsedEntry[] = [];
  let currentEntry: Partial<ParsedEntry> | null = null;
  for (let rawEntry of rawEntries) {
    let [time, command, name] = rawEntry.split("|") as [
      time: TimeInput,
      command: string,
      name: string,
    ];
    name = name ?? "unknown";
    if (command === "start") {
      if (!currentEntry) {
        // There is no new task so start a new one
        currentEntry = {
          name,
          from: time as TimeInput,
        };
      } else {
        // There is a runing task
        if (currentEntry.name != name) {
          // new task stops the current
          currentEntry.to = time;
          currentEntry.duration = calcDuration(
            currentEntry.from!, // TODO: can this be undefined
            currentEntry.to,
          );
          // TODO: check if it's no longer partial
          entries.push(currentEntry as ParsedEntry);

          // and starts a new one
          currentEntry = {
            name,
            from: time,
          };
        }
        // otherwise same task repeated does nothing
      }
    } else if (command === "stop") {
      if (currentEntry) {
        // stop the running task
        currentEntry.to = time;
        currentEntry.duration = calcDuration(
          currentEntry.from!, // TODO: can this be undefined
          currentEntry.to,
        );
        // TODO: check if it's no longer partial
        entries.push(currentEntry as ParsedEntry);
        currentEntry = null;
      }
    }
  }
  // push the last pending entry
  if (currentEntry) {
    const currentTimeMoment = moment(currentTime, "HH:mm");
    const startOfCurrentEntry = moment(currentEntry.from, "HH:mm");
    if (startOfCurrentEntry.isBefore(currentTimeMoment)) {
      currentEntry.toNow = currentTime;
      currentEntry.durationNow = calcDuration(currentEntry.from!, currentTime);
    }

    entries.push(currentEntry as ParsedEntry);
  }
  return entries;
};

export const isTimeInput = (str: string): TimeInput | null => {
  const result = moment(str, "HH:mm");
  return result.isValid() ? (str as TimeInput) : null;
};

export const getCurrentMoment = (
  currentMoment: Moment,
  overrideTime?: TimeInput,
) => {
  if (overrideTime) {
    const overrideMoment = moment(overrideTime, "HH:mm");
    if (overrideMoment.isValid()) {
      return currentMoment
        .clone()
        .hour(overrideMoment.hour())
        .minute(overrideMoment.minute());
    }
  }
  return currentMoment;
};

export const addEntryToState = (
  state: DBState,
  currentMoment: Moment,
  entry: RawEntrySuffix,
) => {
  const currentDay = currentMoment.format(DB_DAY_FORMAT) as NormalizedDayKey;
  const currentTime = currentMoment.format(TIME_FORMAT);

  const entries = ensureDay(state, currentDay);
  entries.push(`${currentTime}|${entry}`);
  entries.sort();
  state.days[currentDay] = entries;
};

export const ensureDay = (state: DBState, currentDay: NormalizedDayKey) => {
  if (!state.days) {
    state.days = {};
  }
  if (!state.days[currentDay]) {
    state.days[currentDay] = [];
  }
  return state.days[currentDay];
};

export const getRawEntries = (state: DBState, currentDay: NormalizedDayKey) => {
  if (state.days) {
    return state.days[currentDay] || [];
  }
  return [];
};

export const getDaysOfThisWeek = (day: Moment, opts?: { weekend: boolean }) => {
  const { weekend = false } = opts || {};
  const todayIndex = day.day();
  const monday = day.clone().subtract(todayIndex - 1, "days");
  const days = [];
  for (let n = 0; n < 5 + (weekend ? 2 : 0); n++) {
    days.push(monday.clone().add(n, "days"));
  }
  return days;
};

const RELATIVE_DAY = /^[~+]?[0-9]+$/;
const DOT_DATE = /^[0123]?[0-9]\.[01]?[0-9]\.[0-9]{4}$/;
const DOT_DATE_SHORT = /^[0123]?[0-9]\.[01]?[0-9]\.$/;
/**
 * Parse day input which could be:
 *  "2022-12-23",
 *  "23.12.2022",
 *  "23.12.", now has to be given to give to take the current year
 *  "~2", the day before yesterday, now has to be given
 *  "0", today, now has to be given
 *  "3" or "+3" the day after the day after tomorrow, now has to be given
 */
export const parseDayInput = (input: DayInput, now?: Moment): Moment => {
  now = now ?? moment();
  let result = moment(input, "YYYY-MM-DD", true);
  if (result && result.isValid()) {
    return result;
  }

  if (DOT_DATE.test(input)) {
    result = moment(input, "D.M.YYYY", false);
    if (result && result.isValid()) {
      return result;
    }
  }

  if (DOT_DATE_SHORT.test(input)) {
    result = moment(input, "D.M.", false);
    if (result && result.isValid() && now) {
      result.set("year", now.get("year"));
      return result;
    }
  }
  if (RELATIVE_DAY.test(input)) {
    const relative = parseInt(input.replace("~", "-"));
    result = now.clone().add(relative, "day");
    return result;
  }
  return moment.invalid(); // or throw error
};

export const allDaysInRange = (from: Moment, to: Moment): Moment[] => {
  const result: Moment[] = [];
  to = to ?? moment();
  let tmp = from.clone();
  while (tmp.isSameOrBefore(to, "day")) {
    result.push(tmp);
    tmp = tmp.clone().add(1, "day");
  }
  return result;
};

export const parseDayInputRange = (opts: {
  from: DayInput;
  to: DayInput;
  now: () => Moment;
}) => {
  const { from, to, now } = opts;
  let fromDay: Moment;
  let toDay: Moment;
  const nowDay = now();
  if (from && to) {
    fromDay = parseDayInput(from, nowDay);
    if (to === "=") {
      toDay = fromDay.clone();
    } else {
      toDay = parseDayInput(to, nowDay);
    }
    if (!fromDay.isValid()) {
      throw new Error(" [from] is not valid " + from);
    }
    if (!toDay.isValid()) {
      throw new Error(" [to] is not valid " + to);
    }
  } else if (from) {
    fromDay = parseDayInput(from, nowDay);
    toDay = now();
    if (!fromDay.isValid()) {
      throw new Error(" [from] is not valid " + from);
    }
  } else {
    fromDay = nowDay;
    toDay = nowDay;
  }
  return { fromDay, toDay };
};

export const parseDayRange = (opts: {
  from: DayInput;
  to: DayInput;
  now: () => Moment;
}) => {
  const { fromDay, toDay } = parseDayInputRange(opts);
  return [...allDaysInRange(fromDay, toDay)];
};

export const parseDayInputRangeToFullWeeks = (opts: {
  from: DayInput;
  to: DayInput;
  now: () => Moment;
}) => {
  const weeks: { days: Moment[] }[] = []; // all Full weeks monday till friday

  const { fromDay, toDay } = parseDayInputRange(opts);
  let first_day_of_the_week: Moment;
  let last_day_of_the_week: Moment;
  let curr: Moment = fromDay;
  do {
    first_day_of_the_week = curr.clone().weekday(0); // Monday for de, Sunday for en etc.
    last_day_of_the_week = curr.clone().weekday(6);
    weeks.push({
      days: [...allDaysInRange(first_day_of_the_week, last_day_of_the_week)],
    });
    curr = curr.clone().add(7, "days");
  } while (curr.isBefore(toDay));

  return weeks;
};

export const getDurationDiff = (
  value: DurationString,
  target: DurationString,
) => {
  const durationSum = moment.duration(value);
  //console.log(durationSum);
  const durationTarget = moment.duration(target);
  // console.log(durationTarget.format());
  const diff = durationTarget.subtract(durationSum);
  return diff;
};

export type DayMode =
  | "work"
  | "holiday"
  | "sick"
  | "weekend"
  | "empty"
  | "weekend-work"
  | "error-sick-and-more"
  | "error-holiday-and-more"
  | "error-unstopped-last-entry";

export const SHORT_MODES: Record<DayMode, string> = {
  work: colors["bgWhite"]["black"]("■ "),
  holiday: colors["bgWhite"]["black"]("h "),
  sick: colors["bgWhite"]["black"]("s "),
  empty: colors["bgWhite"]["black"]("  "),
  weekend: colors["bgYellow"]("  "),
  ["weekend-work"]: colors["bgYellow"]["red"]("■ "),
  ["error-sick-and-more"]: colors["bgRed"]["black"]("s*"),
  ["error-holiday-and-more"]: colors["bgRed"]["black"]("h*"),
  ["error-unstopped-last-entry"]: colors["bgRed"]["black"]("[*"),
};
/**
 *
 **/
export const dayMode = (
  day: moment.Moment,
  parsedEntries: ParsedEntry[],
): DayMode => {
  if ([5, 6].includes(day.weekday())) {
    return "weekend";
  }

  if (parsedEntries.length === 0) {
    return "empty";
  }

  if (
    parsedEntries.find((entry) => entry.name === "sick") &&
    parsedEntries.length === 1
  ) {
    if (parsedEntries.length === 1) return "sick";
    return "error-sick-and-more";
  }

  if (parsedEntries.find((entry) => entry.name === "holiday")) {
    if (parsedEntries.length === 1) return "holiday";
    return "error-holiday-and-more";
  }

  if (!parsedEntries[parsedEntries.length - 1].to)
    return "error-unstopped-last-entry";
  return "work";
};
