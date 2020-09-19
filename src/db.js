const fs = require('fs')
const config = require('src/config')


function readState(){
    // currently a single file is used
    const filename = config.getDatabaseFile()
    const dataFile = fs.readFileSync(filename);
    return JSON.parse(dataFile);
}

function writeState(changedState){
    const filename = config.getDatabaseFile();
    fs.writeFileSync(filename,State)
}

const EXAMPLE_STRUCTURE = {
    days : {
        "2020:07:23": {
            entries : [
                "08:00:start:task0",
                "13:30:start:task1",
                "13:45:stop",
                "14:00:start:task2",
                "15:00:"
            ]
        }
    }
}

function readDay(day){
    if(!day){
        day = moment.format("YYYY:MM:DD")
    }
    return EXAMPLE_STRUCTURE.days[day] || []
}

function writeDay(day){
    if(!day){
        day = moment.format("YYYY:MM:DD")
    }
}

module.exports = {readState, writeState}

