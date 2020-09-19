const config = require('./config')

function startTask(_, task) {
    console.log(`Task ${task} started.`)
}

function stopTask(_, task){
    console.log(`Task stoped.`)
}

function showReport(_){
    console.log(`Show report`)
}

function configure(_){
    console.log(`Database file : ${config.getDatabaseFile()}`)
    console.log(`Config file   : ${config.getConfigFile()}`)
    console.log(`Configuration :\n${JSON.stringify(config,null,2)}`)
}

function countdown(_){

}

module.exports = {startTask, stopTask, showReport, configure, countdown}