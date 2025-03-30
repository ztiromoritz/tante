import fs from "fs";
import { Context } from "../";
import { TimeInput } from "./action.utils";
import { config } from "../config";
import { Brand } from "../util-types";

export type RawEntrySuffix = Brand<string, "RawEntryPrefix">; // start|mxx
// Todo: Template types seems to not keep the brands
export type RawEntry = `${TimeInput}|${RawEntrySuffix}`; // example 08:05|start|mxx
export type NormalizedDayKey = Brand<string, "NormalizedDayKey">; // format like 2022-07-23
export type DBState = {
  version: string;
  days: {
    [date: NormalizedDayKey]: RawEntry[];
  };
};

export function ensureDbFile() {
  const filename = config.getDatabaseFile();
  if (!fs.existsSync(filename)) {
    fs.writeFileSync(filename, '{"version":"alpha","days":{}}');
  }
}

export function archiveDb({ logger, now }: Context) {
  const mainFilename = config.getDatabaseFile();
  const currentMoment = now();
  const suffix = currentMoment.format("-YYYY-MM-DD");
  const archiveFilename = config.getDatabaseFile(suffix);
  ensureDbFile();
  if (fs.existsSync(archiveFilename)) {
    logger.error("There was already an archive created today.");
  } else {
    fs.renameSync(mainFilename, archiveFilename);
    ensureDbFile();
    logger.log(`Moved ${mainFilename} to ${archiveFilename}.`);
  }
}

export function readState() {
  // currently a single file is used
  ensureDbFile();
  const filename = config.getDatabaseFile();
  const dataFile = fs.readFileSync(filename);
  return JSON.parse(dataFile.toString());
}

export function writeState(changedState: any) {
  const filename = config.getDatabaseFile();
  fs.writeFileSync(filename, JSON.stringify(changedState, null, 1));
}

/**ACTIONS **/
export const configure =
  ({ logger, db, config }: Context) =>
  () => {
    logger.log(`Database file : ${config.getDatabaseFile()}`);
    logger.log(`Config file   : ${config.getConfigFile()}`);
    logger.log(`Configuration :\n${JSON.stringify(config, null, 2)}`);
  };

export const dump =
  ({ logger, db }: Context) =>
  () => {
    logger.log(JSON.stringify(db.readState(), null, 2));
  };

export const archive = (ctx: Context) => () => {
  // creates an archive file of the current db
  // and inits with a fresh db
  ctx.db.archiveDb(ctx);
};
