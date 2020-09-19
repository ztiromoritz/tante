const fs = require('fs')
const moment = require('moment')
const config = require('./config')


function ensureDbFile() {
    const filename = config.getDatabaseFile()
    if (!fs.existsSync(filename)) {
        fs.writeFileSync(filename, '{"version":"alpha","days":{}}')
    }
}

function archive({logger, now}) {
    const mainFilename = config.getDatabaseFile()
    const currentMoment = now();
    const suffix = currentMoment.format("-YYYY-MM-DD");
    const archiveFilename = config.getDatabaseFile(suffix)
    ensureDbFile()
    if (fs.existsSync(archiveFilename)) {
        logger.error("There was already an archive created today.")
    } else {
        fs.renameSync(mainFilename, archiveFilename)
        ensureDbFile()
        logger.log(`Moved ${mainFilename} to ${archiveFilename}.`)
    }
}

function readState() {
    // currently a single file is used
    ensureDbFile()
    const filename = config.getDatabaseFile()
    const dataFile = fs.readFileSync(filename)
    return JSON.parse(dataFile)
}

function writeState(changedState) {
    const filename = config.getDatabaseFile()
    fs.writeFileSync(filename, JSON.stringify(changedState))
}


module.exports = {readState, writeState, archive}