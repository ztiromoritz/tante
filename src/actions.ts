import moment, { Moment } from "moment";
import { DAY_FORMAT, TIME_FORMAT } from "./consts";
import colors from "colors";
import {
  parseEntries,
  getRawEntries,
  ensureDay,
  addEntryToState,
  getCurrentMoment,
  sumDuration,
  formatDuration,
  getDaysOfThisWeek,
  TimeInput,
  DayInput,
  DurationString,
  ParsedEntry,
  parseDayInput,
  allDaysInRange,
  parseDayRange,
  formatDurationAsNumber,
  isTimeInput,
} from "./action.utils";
import { Context } from ".";
import { DBState, NormalizedDayKey, RawEntrySuffix } from "./db";

const startTask =
  ({ logger, db, config, now }: Context) =>
  (timeOrTask: string, task: string) => {
    const state = { ...db.readState() };
    const time = isTimeInput(timeOrTask);
    let currentMoment: moment.Moment;
    let currentTime: string;
    if (time) {
      currentMoment = getCurrentMoment(now(), time);
      currentTime = currentMoment.format(TIME_FORMAT);
      task = task || config.defaultTask;
    } else {
      // interpret first value as task
      task = timeOrTask || config.defaultTask;
      currentMoment = getCurrentMoment(now());
      currentTime = currentMoment.format(TIME_FORMAT);
    }
    addEntryToState(state, currentMoment, `start|${task}` as RawEntrySuffix);
    db.writeState(state);
    logger.log(`Task ${task} started at ${currentTime}.`);
  };

const stopTask =
  ({ logger, db, config, now }: Context) =>
  (time: TimeInput) => {
    const state = { ...db.readState() };
    const currentMoment = getCurrentMoment(now(), time);
    const currentTime = currentMoment.format(TIME_FORMAT);
    addEntryToState(state, currentMoment, `stop` as RawEntrySuffix);
    db.writeState(state);
    logger.log(`Task stopped at ${currentTime}.`);
  };

const fullDay =
  ({ logger, db, config, now }: Context) =>
  (fullDayType: "holiday" | "sick") =>
  (day: DayInput) => {
    const state = { ...db.readState() };
    const theDay = (day ? parseDayInput(day) : now()).startOf("day");
    const fromMoment = theDay.clone().hour(8);
    const duration = moment.duration(config.targetPerDay);
    const toMoment = fromMoment.clone().add(duration.asMinutes(), "minutes");
    addEntryToState(
      state,
      fromMoment,
      `start|${fullDayType}` as RawEntrySuffix,
    );
    addEntryToState(state, toMoment, `stop` as RawEntrySuffix);
    db.writeState(state);
    logger.log(
      `Fullday of ${fullDayType} added at ${theDay.format("dddd DD.MM.YYYY")}.`,
    );
  };

const showStatus =
  ({ logger, db, config, now }: Context) =>
  () => {
    const state = { ...db.readState() };
    const day = now();
    const days: Moment[] = getDaysOfThisWeek(day);

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
    for (const d of days) {
      const colorMap = parseColorMap(state, d);
      const colorBar = renderColorBar(colorMap);
      logger.log(colorBar);
    }
    logger.log(colorBarHeader);
    logger.log();

    //
    // Countdown
    //
    moment.duration(0).subtract(3, "minutes").get;
    const getDiff = (value: DurationString, target: DurationString) => {
      const durationSum = moment.duration(value);
      //console.log(durationSum);
      const durationTarget = moment.duration(target);
      // console.log(durationTarget.format());
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

    {
      const { sum, diff } = getCountDownForWeek(days);
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

const showReport =
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

const toCSV =
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

const configure =
  ({ logger, db, config }: Context) =>
  () => {
    logger.log(`Database file : ${config.getDatabaseFile()}`);
    logger.log(`Config file   : ${config.getConfigFile()}`);
    logger.log(`Configuration :\n${JSON.stringify(config, null, 2)}`);
  };

const dump =
  ({ logger, db }: Context) =>
  () => {
    logger.log(JSON.stringify(db.readState(), null, 2));
  };

const archive =
  ({ logger, db, now }: Context) =>
  () => {
    // creates an archive file of the current db
    // and inits with a fresh db
    db.archive({ logger, now });
  };

const STEP_SIZE_IN_MINUTES = 15; //
function parseColorMap(state: DBState, currentMoment: Moment) {
  const currentDay = currentMoment.format(DAY_FORMAT) as NormalizedDayKey;
  const rawEntries = getRawEntries(state, currentDay);
  const entries = (function* gen() {
    yield* rawEntries.map((entry) => {
      const [time, action, task] = entry.split("|");
      return {
        entry,
        moment: moment(time, "H:m").dayOfYear(currentMoment.dayOfYear()),
        action,
        task,
      };
    });
  })();

  const stepMoment = currentMoment.clone().startOf("day");
  let entry = entries.next().value;
  const colorMap = {
    knownTasks: ["_NONE_"],
    map: [] as number[],
  };
  let currentColor = 0;

  for (let m = 0; m < 24 * 60; m += STEP_SIZE_IN_MINUTES) {
    stepMoment.add(STEP_SIZE_IN_MINUTES, "minutes");
    if (entry && entry.moment.isBefore(stepMoment)) {
      // select color
      if (entry.action === "stop") {
        currentColor = 0;
      } else if (entry.action === "start") {
        if (colorMap.knownTasks.includes(entry.task)) {
          currentColor = colorMap.knownTasks.indexOf(entry.task);
        } else {
          currentColor = colorMap.knownTasks.length;
          colorMap.knownTasks.push(entry.task);
        }
      }
      // next value
      entry = entries.next().value;
    }
    // push selected color
    colorMap.map.push(currentColor);
  }
  return colorMap;
}

const renderColorBarHeader = (gap: number, charPerHour: number) => {
  let head = "";
  for (let i = 0; i < 24; i++) {
    let hour;
    if (i % gap === 0) hour = ("" + i).padStart(charPerHour);
    else hour = "".padStart(charPerHour);
    let bgColor = i % 2 ? "bgBrightCyan" : "bgCyan";
    // @ts-expect-error typing file contradicts documentation
    head += colors["black"][bgColor](hour);
  }
  return head;
};

const renderColorBar = (colorMap: { knownTasks: string[]; map: number[] }) => {
  const fgColors = [
    "brightRed",
    "brightMagenta",
    "yellow",
    "green",
    "magenta",
    "cyan",
    "grey",
  ];
  const bgColors = [
    "bgBrightRed",
    "bgBrightMagenta",
    "bgYellow",
    "bgGreen",
    "bgMagenta",
    "bgCyan",
    "bgGray",
  ];
  const CHAR = "▌"; // 1/2 block

  let out = "";
  for (let i = 0; i < colorMap.map.length; i += 2) {
    const left = colorMap.map[i] - 1;
    const right = colorMap.map[i + 1] - 1;
    const fgColor = left < 0 ? "white" : fgColors[left % fgColors.length];
    const bgColor = left < 0 ? "bgWhite" : bgColors[left % fgColors.length];
    // @ts-expect-error typing file contradicts documentation
    out += colors[fgColor][bgColor](CHAR);
  }
  return out;
};

const renderEntries = (
  entries: ParsedEntry[],
  currentMoment: Moment,
  { sum, sumNumber }: { sum: DurationString; sumNumber: string },
) => {
  let out = "\n";
  out += `  ${currentMoment.format("ddd DD.MM.YYYY")}    \n`;
  out += " +-------+-------+-------+--------------------+\n";
  out += " | from  | to    | time  | task               |\n";
  out += " +-------+-------+-------|--------------------+\n";
  for (let entry of entries) {
    const { name, from, to, toNow, duration, durationNow } = entry;
    out += ` | ${from} | ${to || toNow || "     "} | ${
      duration || durationNow || "     "
    } | ${name.padEnd(18)} |\n`;
  }
  out += " +-------+-------+-------+--------------------+\n";
  out += ` |       |       | ${sum} | ${"∑".padEnd(18)} |\n`;
  out += " +-------+-------+-------+--------------------+\n";
  return out;
};

const renderCSVHeader = () => "date      ;from ;to   ;time ;sum  ;sum_as_h";
const renderEntriesAsCSV = (
  entries: ParsedEntry[],
  currentMoment: Moment,
  { sum, sumNumber }: { sum: DurationString; sumNumber: string },
) => {
  let out = "";
  for (let entry of entries) {
    const { name, from, to, toNow, duration, durationNow } = entry;
    out += [
      currentMoment.format("DD.MM.YYYY"),
      from,
      to || toNow || "",
      duration || durationNow || "",
      "     ",
      //name,
      //"     ",
      "\n",
    ].join(";");
  }
  out += `          ;     ;     ;     ;${sum};${sumNumber}`;
  return out;
};

const test =
  ({ logger, db, now }: Context) =>
  () => {
    const state = { ...db.readState() };
    const currentMoment = now();

    // Table
    const entries = parseEntries(state, currentMoment);
    const sum = formatDuration(sumDuration(entries));

    logger.log(renderEntries(entries, currentMoment, { sum, sumNumber: "0" }));

    // Bar
    const colorBarHeader = renderColorBarHeader(2, 2);
    logger.log(colorBarHeader);
    const colorMap = parseColorMap(state, currentMoment);
    const colorBar = renderColorBar(colorMap);
    logger.log(colorBar);
  };

module.exports = {
  startTask,
  stopTask,
  showReport,
  toCSV,
  showStatus,
  configure,
  dump,
  archive,
  test,
  fullDay,
};
