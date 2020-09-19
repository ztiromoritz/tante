const packageJson = require('./package.json')
const { program } = require('commander')
const moment = require('moment')
const config = require('./src/config')
const db = require('./src/db')
const context = {
    db,
    config,
    logger: console,
    now : ()=>moment()
}

const { startTask, stopTask, showStatus, showReport, configure, countdown, dump, archive} = require('./src/actions')

program
    .version(packageJson.version)
    .description(packageJson.description)

program
    .command('start [task] [time]')
    .description('Start a task')
    .action(startTask(context))

program
    .command('stop [time]')
    .description('Stop the current task')
    .action(stopTask(context))


program
    .command('status')
    .description('Show current tracking status')
    .action(showStatus(context))

program
    .command('report')
    .description('Show report')
    .action(showReport(context))

program
    .command('configure')
    .description('Configure')
    .action(configure(context))

program
    .command('countdown')
    .description('How long do i still have to work today')
    .action(countdown(context))

program
    .command('dump')
    .description('Dump the current database')
    .action(dump(context))

program
    .command('archive')
    .description('Dump the current database')
    .action(archive(context))

program.parse(process.argv)
