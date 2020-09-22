const moment = require('moment')
const {DAY_FORMAT, TIME_FORMAT} = require('./consts')


const calcDuration = (from, to) => {
    const duration = moment.duration(moment(to, 'HH:mm').diff(moment(from, 'HH:mm')))
    return `${duration.get('hours').toString().padStart(2,'0')}:${duration.get('minutes').toString().padStart(2,'0')}`
}

const parseEntries = (state, currentMoment) => {
    const currentDay = currentMoment.format(DAY_FORMAT)
    const rawEntries = getRawEntries(state, currentDay);
    const entries = []
    let current = null
    for (let rawEntry of rawEntries) {
        const [time, command, name] = rawEntry.split('|')
        if (command === 'start') {
            if(!current){
                // There is no new task so start a new one
                current = {
                    name,
                    from: time
                }
            }else{
                // There is a runing task
                if(current.name != name){
                    // new task stops the current
                    current.to = time
                    current.duration = calcDuration(current.from, current.to)
                    entries.push(current)

                    // and starts a new one
                    current = {
                        name,
                        from: time
                    }
                }
                // otherwise same task repeated does nothing
            }
        } else if (command === 'stop') {
            if (current) {
                // stop the running task
                current.to = time
                current.duration = calcDuration(current.from, current.to)
                entries.push(current)
                current = null;
            }
        }
    }
    // push the last pending entry
    if (current) {
        entries.push(current)
    }
    return entries
}

const getCurrentMoment = (currentMoment, overrideTime) => {
    if (overrideTime) {
        const overrideMoment = moment(overrideTime, 'H:m');
        if (overrideMoment.isValid()) {
            return currentMoment
                .clone()
                .hour(overrideMoment.hour())
                .minute(overrideMoment.minute())
        }
    }
    return currentMoment
}

const addEntryToState = (state, currentMoment, entry, overrideTime) => {
    const currentDay = currentMoment.format(DAY_FORMAT)
    const currentTime = currentMoment.format(TIME_FORMAT)

    const entries = ensureDay(state, currentDay)
    entries.push(`${currentTime}|${entry}`)
    entries.sort()
    state.days[currentDay] = entries
}

const ensureDay = (state, currentDay) => {
    if (!state.days) {
        state.days = {}
    }
    if (!state.days[currentDay]) {
        state.days[currentDay] = []
    }
    return state.days[currentDay]
}

const getRawEntries = (state, currentDay) => {
    if (state.days) {
        return state.days[currentDay] || [];
    }
    return []
}


module.exports = {parseEntries, getRawEntries, ensureDay, addEntryToState, getCurrentMoment}