const fs = require('fs')
const dayjs = require('dayjs')
const config = require('./config')


function ensureDbFile() {
    const filename = config.getDatabaseFile()
    if (!fs.existsSync(filename)) {
        fs.writeFileSync(filename, '{"version":"alpha","days":[]}')
    }
}

function archive({logger}) {
    const mainFilename = config.getDatabaseFile()
    const archiveFilename = config.getDatabaseFile(dayjs().format("YYYY-MM-DD"))
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