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
  showShortStatus,
  showReport,
  toCSV,
  configure,
  dump,
  archive,
  test,
  fullDay,
} = require("./actions");

//program.version(packageJson.version).description(packageJson.description);
program.storeOptionsAsProperties(true);

program
  .command("start [timeOrTask] [task]")
  .description("Start a task", {
    timeOrTask:
      "The time to start the task on. Given as hh:mm. Default: now. If invalid this will taken as the task.",
    task: "The name or id of the task. Default: " + config.defaultTask + ".",
  })
  .action(startTask(context));

program
  .command("stop [time]")
  .description("Stop the current task", {
    time: "The time to stop the current task. Given as hh:mm. Default: now.",
  })
  .action(stopTask(context));

program
  .command("status", { isDefault: true })
  .option(
    "--short",
    "Short oneline status: {Running|Stopped}|{Time spent today}|{Time to go}|{Time spent this week}|{Time to go this week}",
  )
  .description("Show current tracking status.")
  .action(showStatus(context));

program
  .command("short-status")
  .description(
    "Short oneline status: {Running|Stopped}|{Time spent today}|{Time to go}|{Time spent this week}|{Time to go this week} \n" +
      "Exit Code 0 (Running), Exit Code 1 (Not Running)",
  )
  .action(showShortStatus(context));

const fullDayDescription = (fullDayType: string) => {
  return `Set a full workday amount of hours to the given day as ${fullDayType}

Relevant config is targetPerDay (default: 8).

The optional argument can be given in two forms.

The arguments can be given in two forms. 
Either as date: 
 dd.mm. 
 dd.mm.yyyyy
Or as number relative to today: 
  ~1   (yesterday)  
  0    (today)
  2    (the day after tomorrow)`;
};

program
  .command("holiday [day]")
  .description(fullDayDescription("holiday"), {
    day: `The day the fullday entry should be set`,
  })
  .action(fullDay(context)("holiday"));

program
  .command("sick [day]")
  .description(fullDayDescription("sick"), {
    day: `The day the fullday entry should be set`,
  })
  .action(fullDay(context)("sick"));

program
  .command("report [from] [to]")
  .description(
    `Show a detailed report as table.

The arguments can be given in two forms. 
Either as date: 
 dd.mm. 
 dd.mm.yyyyy
Or as number relative to today: 
  ~1   (yesterday)  
  0    (today)
  2    (the day after tomorrow)`,
    {
      from: `The day to start the report. Default: now`,
      to: `The day to end the report. Default: now`,
    },
  )
  .action(showReport(context));

program
  .command("csv [from] [to]")
  .description(
    `Export a detailed report as csv.

The arguments can be given in two forms. 
Either as date: 
 dd.mm. 
 dd.mm.yyyyy
Or as number relative to today: 
  ~1   (yesterday)  
  0    (today)
  2    (the day after tomorrow)`,
    {
      from: `The day to start the report. Default: now`,
      to: `The day to end the report. Default: now`,
    },
  )
  .action(toCSV(context));

program
  .command("configure")
  .description("Configure")
  .action(configure(context));

program
  .command("dump")
  .description("Dump the current database")
  .action(dump(context));

program
  .command("archive")
  .description(
    "Move the current database to an archive file and create a new empty db",
  )
  .action(archive(context));

program
  .command("chart [from] [to]")
  .description("Arbitrary new feature to test")
  .action(test(context));

program.command("*").action(showStatus(context));

//program.configureHelp({subcommandTerm: (cmd)=>cmd.helpInformation()})
program.parse(process.argv);
