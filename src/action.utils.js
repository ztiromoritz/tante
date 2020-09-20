const moment = require('moment')
const {DAY_FORMAT, TIME_FORMAT} = require('./consts')

const parseEntries = (state, currentMoment)=>{
    const currentDay = currentMoment.format(DAY_FORMAT)
    const rawEntries = getRawEntries(state, currentDay);
    const entries = []
    let current = null
    for(let rawEntry of rawEntries){
        const [time,command,name] = rawEntry.split('|')
        if(command === 'start'){
            if(current && current.name != name){
                current.to= time
                entries.push(current)
            }
            current = {
                name,
                from:time
            }
        }else if(command === 'stop'){
            if(current){
                current.to = time
                entries.push(current)
            }
            current = null;
        }
    }
    if(current){
        entries.push(current)
    }
    return entries
}

const getCurrentMoment = (currentMoment, overrideTime) =>{
    if(overrideTime){
        const overrideMoment = moment(overrideTime, 'H:m');
        if(overrideMoment.isValid()){
            return currentMoment
                .clone()
                .hour(overrideMoment.hour())
                .minute(overrideMoment.minute())
        }
    }
    return currentMoment
}

const addEntryToState = (state, currentMoment, entry, overrideTime)=>{
    const currentDay = currentMoment.format(DAY_FORMAT)
    const currentTime = currentMoment.format(TIME_FORMAT)

    const entries = ensureDay(state, currentDay)
    entries.push(`${currentTime}|${entry}`)
    entries.sort()
    state.days[currentDay]=entries
}

const ensureDay = (state, currentDay)=>{
    if(!state.days){
        state.days = {}
    }
    if(!state.days[currentDay]){
        state.days[currentDay] = []
    }
    return state.days[currentDay]
}

const getRawEntries = (state, currentDay)=>{
    if(state.days){
        return state.days[currentDay] || [];
    }
    return []
}




module.exports = {parseEntries, getRawEntries, ensureDay, addEntryToState, getCurrentMoment}