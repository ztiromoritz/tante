import { existsSync, readFileSync, mkdirSync } from "fs";
import tempDir from "temp-dir";

const tanteHomeDir =
  process.env.TANTE_USE_TEST_HOME === "true"
    ? tempDir + "/.tante"
    : `${process.env.HOME}/.tante`;
const configFile = `${tanteHomeDir}/config.json`;
const databaseDir = `${tanteHomeDir}/db/`;

const DEFAULT_CONFIG = {
  defaultTask: "default",
  databaseName: "db",
  decimalSeparator: ".",
  targetPerWeek: "40:00",
  targetPerDay: "8:00",
  locale: "en",
};

function ensureDirs() {
  if (!existsSync(tanteHomeDir)) {
    mkdirSync(tanteHomeDir);
  }
  if (!existsSync(databaseDir)) {
    mkdirSync(databaseDir);
  }
}

function loadConfigFile() {
  if (existsSync(configFile)) {
    return JSON.parse(readFileSync(configFile).toString());
  } else {
    return {};
  }
}

function readConfig() {
  ensureDirs();
  const initialConfig = {
    ensureDirs,
    getTanteHomeDir: function () {
      return tanteHomeDir;
    },
    getDatabaseFile: function (suffix?: string): string {
      return `${databaseDir}/${this.databaseName}${suffix || ""}.json`;
    },
    getConfigFile: function () {
      return configFile;
    },
    ...DEFAULT_CONFIG,
  };
  return Object.freeze(
    Object.assign<typeof initialConfig, typeof DEFAULT_CONFIG>(
      initialConfig,
      loadConfigFile(),
    ),
  );
}

export const config = readConfig();
