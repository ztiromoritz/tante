import moment from "moment";
import { Context } from "..";
import { TIME_FORMAT } from "../consts";
import {
  addEntryToState,
  DayInput,
  getCurrentMoment,
  isTimeInput,
  parseDayInput,
  TimeInput,
} from "./action.utils";
import { RawEntrySuffix } from "./db";

export const startTask =
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

export const stopTask =
  ({ logger, db, config, now }: Context) =>
  (time: TimeInput) => {
    const state = { ...db.readState() };
    const currentMoment = getCurrentMoment(now(), time);
    const currentTime = currentMoment.format(TIME_FORMAT);
    console.log(currentMoment);
    addEntryToState(state, currentMoment, `stop` as RawEntrySuffix);
    db.writeState(state);
    logger.log(`Task stopped at ${currentTime}.`);
  };

export const setTask =
  ({ logger, db, config, now }: Context) =>
  (
    command: "start" | "stop",
    day: DayInput,
    timeOrTask: string,
    task: string,
  ) => {
    const dayToSet = parseDayInput(day);
    if (command === "start") {
      startTask({ logger, db, config, now: () => dayToSet })(timeOrTask, task);
    } else if (command === "stop") {
      stopTask({ logger, db, config, now: () => dayToSet })(
        timeOrTask as TimeInput,
      );
    } else {
      throw Error("Invalid command " + command);
    }
  };

export const fullDay =
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
