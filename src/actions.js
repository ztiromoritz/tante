const config = require('./config')
const DAY_FORMAT = 'YYYY-MM-DD'
const TIME_FORMAT = 'HH:mm'

const addEntryToState = (state, currentMoment, entry)=>{
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

const startTask = ({logger,db,config,now}) => (task) => {
    const state = {...db.readState()}
    const currentMoment = now();
    const currentTime = currentMoment.format(TIME_FORMAT)
    addEntryToState(state, currentMoment, `start|${task}`)
    db.writeState(state);
    logger.log(`Task ${task} started at ${currentTime}.`)
}

const stopTask = ({logger,db,config,now}) => (task) => {
    const state = {...db.readState()}
    const currentMoment = now();
    addEntryToState(state, currentMoment, `stop`)
    db.writeState(state)
    logger.log(`Task stopped.`)
}

const showStatus = ({logger,db,config, now}) => ()=>{
    const state = {...db.readState()}
    const currentMoment = now()
    const entries = parseEntries(state, currentMoment)
    if(entries.length === 0 || Boolean(entries.slice(-1)[0].to)){
        logger.log('No task is running.')
    }else{
        const {name, from} = entries.slice(-1)[0]
        logger.log(`Task '${name}' is running since ${from}.`)
    }
}

const showReport= ({logger,db,config, now}) =>(_)=>{
    const state = {...db.readState()}
    const currentMoment = now();
    const entries = parseEntries(state, currentMoment)
    logger.log(' +-------+-------+-----------------------------+')
    logger.log(' | from  | to    | task                        |')
    logger.log(' +-------+-------+-----------------------------+')
    for(let entry of entries){
        const {name,from,to} = entry
        logger.log(` | ${from} | ${to||'     '} | ${name.padEnd(27)} |` )
    }
    logger.log(' +-------+-------+-----------------------------+')
}

const configure = ({logger,db,config}) => (_) =>{
    logger.log(`Database file : ${config.getDatabaseFile()}`)
    logger.log(`Config file   : ${config.getConfigFile()}`)
    logger.log(`Configuration :\n${JSON.stringify(config,null,2)}`)
}

const dump = ({logger,db}) => () => {
    logger.log(JSON.stringify(db.readState(),null,2))
}

const archive = ({logger, db}) => ()=> {
    // creates an archive file of the current db
    // and inits with a fresh db
    db.archive({logger})
}

function countdown(){

}

module.exports = {startTask, stopTask, showReport, showStatus, configure, countdown, dump, archive}