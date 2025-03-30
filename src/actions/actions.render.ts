import moment from "moment";
import { Moment } from "moment";
import { DB_DAY_FORMAT } from "../consts";
import {
  DayMode,
  DurationString,
  getRawEntries,
  ParsedEntry,
} from "./action.utils";
import { DBState, NormalizedDayKey } from "./db";
import colors from "colors";

const STEP_SIZE_IN_MINUTES = 15; //
export function parseColorMap(state: DBState, currentMoment: Moment) {
  const currentDay = currentMoment.format(DB_DAY_FORMAT) as NormalizedDayKey;
  const rawEntries = getRawEntries(state, currentDay);
  const entries = (function* gen() {
    yield* rawEntries.map((entry) => {
      const [time, action, task] = entry.split("|");
      return {
        moment: moment(time, "H:m").dayOfYear(currentMoment.dayOfYear()),
        action,
        task,
      } as { action: "start" | "stop"; moment: moment.Moment; task: string };
    });
    yield {
      moment: currentMoment.clone(),
      action: "stop",
    } as { action: "stop"; moment: moment.Moment };
  })();

  const stepMoment = currentMoment.clone().startOf("day");
  let entry = entries.next().value;
  const colorMap = {
    knownTasks: ["_NONE_", "default", "sick", "holiday"],
    map: [] as number[],
    offset: 0,
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

export const renderColorBarHeader = (gap: number, charPerHour: number) => {
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

export const renderColorBar = (colorMap: {
  knownTasks: string[];
  map: number[];
  offset?: number;
}) => {
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
  const { offset = 0 } = colorMap;
  const CHAR = "▌"; // 1/2 block. U+258C
  let out = "";
  for (let i = 0; i < colorMap.map.length; i += 2) {
    const left = colorMap.map[i] - 1;
    const right = colorMap.map[i + 1] - 1; //??
    const fgColor =
      left < 0
        ? ["white", "yellow"][offset % 2]
        : fgColors[left % fgColors.length];
    const bgColor =
      right < 0
        ? ["bgWhite", "bgYellow"][offset % 2]
        : bgColors[right % fgColors.length];
    //console.log({ fgColor, bgColor });
    // @ts-expect-error typing file contradicts documentation
    out += colors[fgColor][bgColor](CHAR);
  }
  return out;
};

export const renderEntries = (
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

export const renderCSVHeader = () =>
  "date      ;from ;to   ;time ;sum  ;sum_as_h";
export const renderEntriesAsCSV = (
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
