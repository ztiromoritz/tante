const fs = require('fs')
const tempDir = require('temp-dir')

const tanteHomeDir = (process.env.TANTE_USE_TEST_HOME=== 'true')  ? tempDir + '/.tante' : `${process.env.HOME}/.tante`
const configFile = `${tanteHomeDir}/config.json`
const databaseDir = `${tanteHomeDir}/db/`

const DEFAULT_CONFIG = {
    defaultTask: 'default',
    databaseName: 'db'
}

function ensureDirs() {
    if (!fs.existsSync(tanteHomeDir)) {
        fs.mkdirSync(tanteHomeDir)
    }
    if(!fs.existsSync(databaseDir)){
        fs.mkdirSync(databaseDir)
    }
}

function loadConfigFile() {
    if (fs.existsSync(configFile)) {
        return JSON.parse(fs.readFileSync(configFile))
    } else {
        return {}
    }
}

function readConfig() {
    ensureDirs()
    return Object.assign({
        ensureDirs,
        getTanteHomeDir: function () {
            return tanteHomeDir;
        },
        getDatabaseFile: function (suffix) {
            return `${databaseDir}/${this.databaseName}${suffix || ''}.json`
        },
        getConfigFile: function () {
            return configFile
        }
    }, DEFAULT_CONFIG, loadConfigFile())
}

module.exports = readConfig()