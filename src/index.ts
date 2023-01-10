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
} = require("./actions");

//program.version(packageJson.version).description(packageJson.description);
program.storeOptionsAsProperties(true);

program
  .command("start [task] [time]")
  .description("Start a task", {
    task: "The name or id of the task. Default: " + config.defaultTask + ".",
    time: "The time to start the task on. Given as hh:mm. Default: now.",
  })
  .action(startTask(context));

program
  .command("stop [time]")
  .description("Stop the current task", {
    time: "The time to stop the current task. Given as hh:mm. Default: now.",
  })
  .action(stopTask(context));

program
  .command("status")
  .description("Show current tracking status")
  .action(showStatus(context));

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
    }
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
    }
  )
  .action(toCSV(context));

program
  .command("configure")
  .description("Configure")
  .action(configure(context));

program
  .command("countdown [day|week]")
  .description("How long do i still have to work today")
  .action(countdown(context));

program
  .command("dump")
  .description("Dump the current database")
  .action(dump(context));

program
  .command("archive")
  .description(
    "Move the current database to an archive file and create a new empty db"
  )
  .action(archive(context));

program
  .command("chart [from] [to]")
  .description("Arbitrary new feature to test")
  .action(test(context));

program.parse(process.argv);
