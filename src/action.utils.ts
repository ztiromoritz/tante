import moment, { Moment, Duration } from "moment";
import { DBState, NormalizedDayKey, RawEntrySuffix } from "./db";
import { Brand } from "./util-types";
const { DAY_FORMAT, TIME_FORMAT } = require("./consts");

export type TimeInput = string; // format like '03:00' or '9:23'  see consts.TIME_FORMAT
export type DayInput = string; // formats like '2022-11-23' or '23.11' or '23.11.2022' ???
export type DurationString = Brand<string, "DurationString">; // format 40:22
export type ParsedEntry = {
  name: string;
  from: string; // ?? TimeInput
  to: string; // ?? TimeInput
  duration: string;
  toNow?: string;
  durationNow?: string;
};

export const formatDuration = (duration: Duration): DurationString => {
  if (duration.asMinutes() > 0) {
    const hours = Math.floor(duration.asMinutes() / 60);
    const minutes = duration.asMinutes() % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}` as DurationString;
  } else {
    const hours = Math.floor(-duration.asMinutes() / 60);
    const minutes = -duration.asMinutes() % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}` as DurationString;
  }
};

const calcDuration = (from: TimeInput, to: TimeInput) => {
  const duration = moment.duration(
    moment(to, "HH:mm").diff(moment(from, "HH:mm"))
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
  return formatDuration(durationSum);
};

export const parseEntries = (state: DBState, currentMoment: Moment) => {
  const currentDay = currentMoment.format(DAY_FORMAT) as NormalizedDayKey;
  const currentTime = currentMoment.format(TIME_FORMAT);
  const rawEntries = getRawEntries(state, currentDay);
  const entries: ParsedEntry[] = [];
  let currentEntry: Partial<ParsedEntry> | null = null;
  for (let rawEntry of rawEntries) {
    let [time, command, name] = rawEntry.split("|");
    name = name ?? "unknown";
    if (command === "start") {
      if (!currentEntry) {
        // There is no new task so start a new one
        currentEntry = {
          name,
          from: time,
        };
      } else {
        // There is a runing task
        if (currentEntry.name != name) {
          // new task stops the current
          currentEntry.to = time;
          currentEntry.duration = calcDuration(
            currentEntry.from!, // TODO: can this be undefined
            currentEntry.to
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
          currentEntry.to
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

export const getCurrentMoment = (
  currentMoment: Moment,
  overrideTime: TimeInput
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
  entry: RawEntrySuffix
) => {
  const currentDay = currentMoment.format(DAY_FORMAT) as NormalizedDayKey;
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

export const getDaysOfThisWeek = (day: Moment) => {
  const todayIndex = day.day();
  const monday = day.clone().subtract(todayIndex - 1, "days");
  const days = [];
  for (let n = 0; n < 5; n++) {
    days.push(monday.clone().add(n, "days"));
  }
  return days;
};
