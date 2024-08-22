import moment from "moment";
import { program } from "commander";
import { config } from "./config";
const db = require("./db");
const context = {
  db,
  config,
  logger: console,
  now: () => moment(),
};

export type Context = typeof context;

moment.locale(config.locale);

const {
  startTask,
  stopTask,
  showStatus,
  showReport,
  toCSV,
  configure,
  countdown,
  dump,
  archive,
  test,
  fullDay,
} = require("./actions");
const colors = require("colors");

const DATE_ARGUMENT = `                           The arguments can be given in two forms. 
                           Either as date: 
                            dd.mm. 
                            dd.mm.yyyyy
                           Or as number relative to today: 
                             ~1   (yesterday)  
                             0    (today)
                             2    (the day after tomorrow)
`;

//program.version(packageJson.version).description(packageJson.description);
program.storeOptionsAsProperties(true);

program
  .command(colors.underline.green("start") + " [timeOrTask] [task]")
  .description("Start a task", {
    timeOrTask:
      "The time to start the task on. Given as hh:mm. Default: now. If invalid this will taken as the task.",
    task: "The name or id of the task. Default: " + config.defaultTask + ".",
  })
  .action(startTask(context));

program
  .command(colors.underline.green("stop") + " [time]")
  .description("Stop the current task", {
    time: "The time to stop the current task. Given as hh:mm. Default: now.",
  })
  .action(stopTask(context));

program
  .command(colors.underline.green("status") + "")
  .description("Show current tracking status")
  .action(showStatus(context));

const fullDayDescription = (fullDayType: string) => {
  return `Set a full workday amount of hours to the given day as ${fullDayType}
                           Relevant config is targetPerDay (default: 8).
${DATE_ARGUMENT}

`;
};

program
  .command(colors.underline.green("holiday") + " [day]")
  .description(fullDayDescription("holiday"), {
    day: `The day the fullday entry should be set`,
  })
  .action(fullDay(context)("holiday"));

program
  .command(colors.underline.green("sick") + " [day]")
  .description(fullDayDescription("sick"), {
    day: `The day the fullday entry should be set`,
  })
  .action(fullDay(context)("sick"));

program
  .command(colors.underline.green("report") + " [from] [to]")
  .description(
    `Show a detailed report as table.
${DATE_ARGUMENT}

`,
    {
      from: `The day to start the report. Default: now`,
      to: `The day to end the report. Default: now`,
    },
  )
  .action(showReport(context));

program
  .command(colors.underline.green("csv") + " [from] [to]")
  .description(
    `Export a detailed report as csv.
${DATE_ARGUMENT}

`,
    {
      from: `The day to start the report. Default: now`,
      to: `The day to end the report. Default: now`,
    },
  )
  .action(toCSV(context));

program
  .command(colors.underline.green("configure") + "")
  .description("Configure")
  .action(configure(context));

program
  .command(colors.underline.green("countdown") + " [day|week]")
  .description("How long do i still have to work today")
  .action(countdown(context));

program
  .command(colors.underline.green("dump") + "")
  .description("Dump the current database")
  .action(dump(context));

program
  .command(colors.underline.green("archive") + "")
  .description(
    "Move the current database to an archive file and create a new empty db",
  )
  .action(archive(context));

program
  .command(colors.underline.green("chart") + " [from] [to]")
  .description("Arbitrary new feature to test")
  .action(test(context));

program.parse(process.argv);
