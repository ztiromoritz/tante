const config = require('./config')
const moment = require('moment')
const {DAY_FORMAT, TIME_FORMAT} = require('./consts')
const colors = require('colors')
const {parseEntries, getRawEntries, ensureDay, addEntryToState, getCurrentMoment} = require('./action.utils')

const startTask = ({logger, db, config, now}) => (task, time) => {
    const state = {...db.readState()}
    const currentMoment = getCurrentMoment(now(), time)
    const currentTime = currentMoment.format(TIME_FORMAT)
    addEntryToState(state, currentMoment, `start|${task}`)
    db.writeState(state);
    logger.log(`Task ${task} started at ${currentTime}.`)
}

const stopTask = ({logger, db, config, now}) => (time) => {
    const state = {...db.readState()}
    const currentMoment = getCurrentMoment(now(), time)
    const currentTime = currentMoment.format(TIME_FORMAT)
    addEntryToState(state, currentMoment, `stop`)
    db.writeState(state)
    logger.log(`Task stopped at ${currentTime}.`)
}

const showStatus = ({logger, db, config, now}) => () => {
    const state = {...db.readState()}
    const currentMoment = now()
    const entries = parseEntries(state, currentMoment)
    if (entries.length === 0 || Boolean(entries.slice(-1)[0].to)) {
        logger.log('No task is running.')
    } else {
        const {name, from} = entries.slice(-1)[0]
        logger.log(`Task '${name}' is running since ${from}.`)
    }
}

const showReport = ({logger, db, config, now}) => (_) => {
    const state = {...db.readState()}
    const currentMoment = now();
    const entries = parseEntries(state, currentMoment)
    logger.log(renderEntries(entries, currentMoment))
}

const configure = ({logger, db, config}) => (_) => {
    logger.log(`Database file : ${config.getDatabaseFile()}`)
    logger.log(`Config file   : ${config.getConfigFile()}`)
    logger.log(`Configuration :\n${JSON.stringify(config, null, 2)}`)
}

const dump = ({logger, db}) => () => {
    logger.log(JSON.stringify(db.readState(), null, 2))
}

const archive = ({logger, db, now}) => () => {
    // creates an archive file of the current db
    // and inits with a fresh db
    db.archive({logger, now})
}

function countdown() {

}

const STEP_SIZE_IN_MINUTES = 15 //
function parseColorMap(state, currentMoment) {

    const currentDay = currentMoment.format(DAY_FORMAT)
    const rawEntries = getRawEntries(state, currentDay);
    const entries = (function* gen() {
        yield* rawEntries.map(entry => {
            const [time, action, task] = entry.split('|')
            return {entry, moment: moment(time, 'H:m'), action, task}
        })
    })()

    const stepMoment = currentMoment.clone().startOf('day')
    let entry = entries.next().value
    const colorMap = {
        knowTasks: ['_NONE_'],
        map: []
    }
    let currentColor = 0


    for (let m = 0; m < 24 * 60; m += STEP_SIZE_IN_MINUTES) {
        stepMoment.add(STEP_SIZE_IN_MINUTES, 'minutes')
        if (entry && entry.moment.isBefore(stepMoment)) {
            // select color
            if (entry.action === 'stop') {
                currentColor = 0
            } else if (entry.action === 'start') {
                if (colorMap.knowTasks.includes(entry.task)) {
                    currentColor = colorMap.knowTasks.indexOf(entry.task)
                } else {
                    currentColor = colorMap.knowTasks.length
                    colorMap.knowTasks.push(entry.task)
                }
            }
            // next value
            entry = entries.next().value
        }
        // push selected color
        colorMap.map.push(currentColor)
    }
    return colorMap
}


const renderColorBarHeader = (gap,charPerHour)=>{
    let head = ''
    for (let i = 0; i < 24; i++) {
        let hour;
        if ((i % gap) === 0)
            hour = ("" + i).padStart(charPerHour)
        else
            hour = ''.padStart(charPerHour)
        let bgColor = (i % 2) ? 'bgBrightBlue' : 'bgBlue';
        head += colors[bgColor](hour)
    }
    return head
}

const renderColorBar = (colorMap) => {
    const fgColors = ['brightRed', 'brightMagenta', 'yellow', 'green', 'magenta', 'cyan', 'grey']
    const bgColors = ['bgBrightRed', 'bgBrightMagenta', 'bgYellow', 'bgGreen', 'bgMagenta', 'bgCyan', 'bgGray']
    const CHAR = "▌" // 1/2 block

    let out = ''
    for (let i = 0; i < colorMap.map.length; i += 2) {
        const left = colorMap.map[i] - 1
        const right = colorMap.map[i + 1] - 1
        const fgColor = (left < 0) ? 'white' : fgColors[left % fgColors.length]
        const bgColor = (left < 0) ? 'bgWhite' : bgColors[left % fgColors.length]
        out += colors[fgColor][bgColor](CHAR)
    }
    return out
}


const renderEntries = (entries, currentMoment) => {
    let out = ''
    out += `  ${currentMoment.format("DD.MM.YYYY")}        \n`
    out += ' +-------+-------+----------------------------+\n'
    out += ' | from  | to    | time  | task               |\n'
    out += ' +-------+-------+-------|--------------------+\n'
    for (let entry of entries) {
        const {name, from, to, duration} = entry
        out += ` | ${from} | ${to || '     '} | ${duration || '     '} | ${name.padEnd(18)} |\n`
    }
    out += ' +-------+-------+---------+------------------+\n'
    return out
}

const test = ({state, logger, db, now}) => () => {
    const state = {...db.readState()}
    const currentMoment = now();

    // Table
    const entries = parseEntries(state, currentMoment)

    logger.log(renderEntries(entries, currentMoment))

    // Bar
    const colorMap = parseColorMap(state, currentMoment)
    const colorBarHeader = renderColorBarHeader(2,2)
    logger.log(colorBarHeader)
    const colorBar = renderColorBar(colorMap)
    logger.log(colorBar)
}

module.exports = {startTask, stopTask, showReport, showStatus, configure, countdown, dump, archive, test}