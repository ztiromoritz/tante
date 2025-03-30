import moment, { Moment } from "moment";
import { Context } from "..";
import {
  DurationString,
  formatDuration,
  getDaysOfThisWeek,
  getDurationDiff,
  parseEntries,
  sumDuration,
} from "./action.utils";

import {
  parseColorMap,
  renderColorBar,
  renderColorBarHeader,
} from "./actions.render";

export const showShortStatus =
  ({ logger, db, config, now }: Context) =>
  () => {
    const state = { ...db.readState() };
    const day = now();

    const entries = parseEntries(state, day);
    const running = !(entries.length === 0 || Boolean(entries.slice(-1)[0].to));
    const weeks = [];
    for (let i = -2; i <= 0; i++) {
      weeks.push(getDaysOfThisWeek(day.clone().add(i, "week")));
    }
    const thisWeek = weeks.at(-1) || [];

    const getDiff = (value: DurationString, target: DurationString) => {
      const durationSum = moment.duration(value);
      const durationTarget = moment.duration(target);
      const diff = durationTarget.subtract(durationSum);
      return diff;
    };

    const getCountDownForWeek = (days: Moment[]) => {
      const targetPerWeek = (config.targetPerWeek || "40:00") as DurationString;

      const state = { ...db.readState() };
      const allEntries = [];
      for (let day of days) {
        const entries = parseEntries(state, day);
        allEntries.push(...entries);
      }
      const sum = formatDuration(sumDuration(allEntries));
      const diff = getDiff(sum, targetPerWeek);
      return { sum, diff };
    };

    const getCountdownForDay = (day: Moment) => {
      const targetPerDay = (config.targetPerDay || "8:00") as DurationString;
      const state = { ...db.readState() };
      const entries = parseEntries(state, day);
      const sum = formatDuration(sumDuration(entries));
      const diff = getDiff(sum, targetPerDay);
      return { sum, diff };
    };

    let timeSpentToday, timeToGoToday, timeSpentThisWeek, timeToGoThisWeek;

    {
      const { sum, diff } = getCountDownForWeek(thisWeek);
      timeSpentThisWeek = sum;
      timeToGoThisWeek =
        (diff.asMinutes() > 0 ? "" : "-") + formatDuration(diff);
    }
    {
      const { sum, diff } = getCountdownForDay(day);
      timeSpentToday = sum;
      timeToGoToday = (diff.asMinutes() > 0 ? "" : "-") + formatDuration(diff);
    }
    //"Short oneline status: {Running|Stopped}|{Time spent today}|{Time to go}|{Time spent this week}|{Time to go this week} \n" +
    logger.log(
      `${running ? "Running" : "Stopped"}|${timeSpentToday}|${timeToGoToday}|${timeSpentThisWeek}|${timeToGoThisWeek}`,
    );
    process.exit(running ? 0 : 1);
  };

export const showStatus =
  ({ logger, db, config, now }: Context) =>
  () => {
    const state = { ...db.readState() };
    const day = now();

    const weeks = [];
    for (let i = -2; i <= 0; i++) {
      const weekdays = getDaysOfThisWeek(day.clone().add(i, "week"), {
        weekend: true,
      });
      weeks.push(weekdays);
    }
    const thisWeek = weeks.at(-1) || [];

    //
    // Status
    //
    logger.log();
    const entries = parseEntries(state, day);
    if (entries.length === 0 || Boolean(entries.slice(-1)[0].to)) {
      logger.log("No task is running.");
    } else {
      const { name, from } = entries.slice(-1)[0];
      logger.log(`Task '${name}' is running since ${from}.`);
    }
    logger.log();

    //
    // Color Bars
    //
    const colorBarHeader = renderColorBarHeader(2, 2);
    logger.log(colorBarHeader);
    for (const week of weeks) {
      week.forEach((day, index) => {
        const colorMap = parseColorMap(state, day);
        colorMap.offset = index < 5 ? 0 : 1;
        //console.log({ colorMap });
        const colorBar = renderColorBar(colorMap);
        logger.log(colorBar);
      });
      logger.log(colorBarHeader);
    }
    //
    // Countdown
    //
    moment.duration(0).subtract(3, "minutes").get;

    const getCountDownForWeek = (days: Moment[]) => {
      const targetPerWeek = (config.targetPerWeek || "40:00") as DurationString;

      const state = { ...db.readState() };
      const allEntries = [];
      for (let day of days) {
        const entries = parseEntries(state, day);
        allEntries.push(...entries);
      }
      const sum = formatDuration(sumDuration(allEntries));
      const diff = getDurationDiff(sum, targetPerWeek);
      return { sum, diff };
    };

    const getCountdownForDay = (day: Moment) => {
      const targetPerDay = (config.targetPerDay || "8:00") as DurationString;
      const state = { ...db.readState() };
      const entries = parseEntries(state, day);
      const sum = formatDuration(sumDuration(entries));
      const diff = getDurationDiff(sum, targetPerDay);
      return { sum, diff };
    };

    {
      const { sum, diff } = getCountDownForWeek(thisWeek);
      logger.log("Time spent this week " + sum);
      if (diff.asMinutes() > 0) {
        logger.log("Time to go           " + formatDuration(diff));
      } else {
        logger.log("Overtime             " + formatDuration(diff));
      }
    }
    logger.log();
    {
      const { sum, diff } = getCountdownForDay(day);
      logger.log("Time spent today     " + sum);
      const finished = day.add(diff, "minutes").format("HH:mm");
      if (diff.asMinutes() > 0) {
        logger.log("Time to go           " + formatDuration(diff));
        logger.log("You are finished     " + finished);
      } else {
        logger.log("Overtime             " + formatDuration(diff));
        logger.log("You were finished    " + finished);
      }
    }
  };
