const fs = require('fs')

const configDir = `${process.env.HOME}/.tante`
const configFile = `${process.env.HOME}/.tante/config.json`

const DEFAULT_CONFIG = {
    defaultTask : 'default',
    databaseName : 'db'
}

function ensureConfigDir(){
    if(!fs.existsSync(configDir)){
        console.log(`Config directory ${configDir} created.`)
        fs.mkdirSync(configDir)
    }
}

function loadConfigFile(){
    if(fs.existsSync(configFile)){
        return JSON.parse(fs.readFileSync(configFile))
    }else{
        return {}
    }
}

function readConfig(){
    ensureConfigDir()
    return Object.assign({
        getDatabaseFile : function(suffix){
            return `${configDir}/${this.databaseName}${suffix||''}.json`
        },
        getConfigFile : function(){
            return configFile
        }
    },DEFAULT_CONFIG, loadConfigFile())
}

module.exports = readConfig()