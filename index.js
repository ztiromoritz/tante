const packageJson = require('./package.json')
const { program } = require('commander')
const config = require('./config')
const { startTask, stopTask, showStatus, showReport, configure, countdown} = require('./actions')


program
    .version(packageJson.version)
    .description(packageJson.description)

program
    .command('start [task] [time]')
    .description('Start a task')
    .action(startTask)

program
    .command('stop [time]')
    .description('Stop the current task')
    .action(stopTask)


program
    .command('status')
    .description('Show current tracking status')
    .action(showStatus)

program
    .command('report')
    .description('Show report')
    .action(showReport)

program
    .command('configure')
    .description('Configure')
    .action(configure)

program
    .action('countdown')
    .description('How long do i still have to work today')
    .action(countdown)

program.parse(process.argv)
