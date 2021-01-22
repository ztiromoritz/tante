const moment = require('moment')
const {DAY_FORMAT, TIME_FORMAT} = require('./consts')

const formatDuration = (duration)=>{
    if(duration.asMinutes() > 0){
        const hours = Math.floor( duration.asMinutes() / 60);
        const minutes = duration.asMinutes() % 60;
        return `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}`
    } else {
        const hours = Math.floor( -duration.asMinutes() / 60);
        const minutes = -duration.asMinutes() % 60;
        return `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}`
    }
   return
}

const calcDuration = (from, to) => {
    const duration = moment.duration(moment(to, 'HH:mm').diff(moment(from, 'HH:mm')))
    return formatDuration(duration);
}

const sumDuration = (entries) => {
    const durationSum = entries
        .map(_ => ( _.duration || _.durationNow) )
        .filter(Boolean)
        .map(_=>moment.duration(_,'HH:mm'))
        .reduce((sum, current) =>{
            return sum.add(current)
        }, moment.duration(0))
    return formatDuration(durationSum);
}


const parseEntries = (state, currentMoment) => {
    const currentDay = currentMoment.format(DAY_FORMAT)
    const currentTime = currentMoment.format(TIME_FORMAT)
    const rawEntries = getRawEntries(state, currentDay);
    const entries = []
    let currentEntry = null
    for (let rawEntry of rawEntries) {
        const [time, command, name] = rawEntry.split('|')
        if (command === 'start') {
            if(!currentEntry){
                // There is no new task so start a new one
                currentEntry = {
                    name,
                    from: time
                }
            }else{
                // There is a runing task
                if(currentEntry.name != name){
                    // new task stops the current
                    currentEntry.to = time
                    currentEntry.duration = calcDuration(currentEntry.from, currentEntry.to)
                    entries.push(currentEntry)

                    // and starts a new one
                    currentEntry = {
                        name,
                        from: time
                    }
                }
                // otherwise same task repeated does nothing
            }
        } else if (command === 'stop') {
            if (currentEntry) {
                // stop the running task
                currentEntry.to = time
                currentEntry.duration = calcDuration(currentEntry.from, currentEntry.to)
                entries.push(currentEntry)
                currentEntry = null;
            }
        }
    }
    // push the last pending entry
    if (currentEntry) {
        const currentTimeMoment = moment(currentTime, 'HH:mm');
        const startOfCurrentEntry = moment(currentEntry.from, 'HH:mm');
        if(startOfCurrentEntry.isBefore(currentTimeMoment)){
            currentEntry.toNow = currentTime
            currentEntry.durationNow = calcDuration(currentEntry.from, currentTime)
        }

        entries.push(currentEntry)
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


module.exports = {parseEntries, getRawEntries, ensureDay, addEntryToState, getCurrentMoment, sumDuration, formatDuration}