import moment, { duration, Moment } from "moment";
import { Context } from "..";
import { DAY_FORMAT, DB_DAY_FORMAT } from "../consts";
import {
  DayInput,
  dayMode,
  DurationString,
  formatDuration,
  formatDurationAsNumber,
  getDurationDiff,
  parseDayInputRangeToFullWeeks,
  parseDayRange,
  parseEntries,
  SHORT_MODES,
  sumDuration,
} from "./action.utils";
import {
  renderCSVHeader,
  renderEntries,
  renderEntriesAsCSV,
} from "./actions.render";

export const showReport =
  ({ logger, db, config, now }: Context) =>
  (from: DayInput, to: DayInput) => {
    const days = parseDayRange({ from, to, now });
    const state = { ...db.readState() };
    days.forEach((day) => {
      const entries = parseEntries(state, day);
      const duration = sumDuration(entries);
      const sum = formatDuration(duration);
      const sumNumber = formatDurationAsNumber(duration);
      logger.log(renderEntries(entries, day, { sum, sumNumber }));
    });
  };

export const toCSV =
  ({ logger, db, config, now }: Context) =>
  (from: DayInput, to: DayInput) => {
    const days = parseDayRange({ from, to, now });
    const state = { ...db.readState() };
    logger.log(renderCSVHeader());
    days.forEach((day) => {
      const entries = parseEntries(state, day);
      const duration = sumDuration(entries);
      const sum = formatDuration(duration);
      const sumNumber = formatDurationAsNumber(duration);
      logger.log(renderEntriesAsCSV(entries, day, { sum, sumNumber }));
    });
  };

export const addUp =
  ({ logger, db, config, now }: Context) =>
  (from: DayInput, to: DayInput) => {
    const state = { ...db.readState() };
    const targetPerWeek = (config.targetPerWeek || "40:00") as DurationString;
    const target = moment.duration(targetPerWeek);
    const weeks = parseDayInputRangeToFullWeeks({ from, to, now });
    const weeksData: Record<
      string,
      {
        days: { day: moment.Moment; duration: moment.Duration }[];
        duration: moment.Duration;
        over_under: moment.Duration;
      }
    > = {};
    for (const week of weeks) {
      const key = `${week.days[0].isoWeekYear()}-kw-${("" + week.days[0].isoWeek()).padStart(2, "0")}`;
      weeksData[key] = weeksData[key] || {};
      weeksData[key].days = weeksData[key].days || [];
      // colect duration from days
      week.days.forEach((day) => {
        const entries = parseEntries(state, day);
        const duration = sumDuration(entries);
        weeksData[key].days.push({ duration, day });
      });
      if (week.days.length !== 7)
        throw new Error("Length: " + week.days.length);

      weeksData[key].duration = weeksData[key].days.reduce(
        (acc, cur) => acc.add(cur.duration),
        moment.duration(0),
      );
      weeksData[key].over_under = weeksData[key].duration
        .clone()
        .subtract(target);
    }

    const acc = moment.duration(0);
    for (const kw in weeksData) {
      const data = weeksData[kw];
      //console.log(data.over_under.asMinutes(), data.over_under.toJSON());
      acc.add(data.over_under);
      const modeChart = data.days
        .map(({ day }) => SHORT_MODES[dayMode(day, parseEntries(state, day))])
        .join("");
      const first_day_of_the_week = data.days[0].day.format(DAY_FORMAT);
      const duration = formatDuration(data.duration, { signed: true });
      const over_under = formatDuration(data.over_under, { signed: true });
      const accStr = formatDuration(acc, { signed: true }).padStart(9, " ");
      logger.log(
        `${kw}  ${first_day_of_the_week}  ${duration}   ${over_under} ${accStr} ${modeChart}`,
      );
    }

    //console.log(JSON.stringify(weeksData, null, 2));
  };
