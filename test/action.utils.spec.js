const moment = require('moment')
const assert = require('assert').strict
const {parseEntries} = require("../src/action.utils");
const TEST_NOW = "2021-07-24-18:03"
const TEST_MOMENT = moment(TEST_NOW, 'YYYY-MM-DD-HH:mm')

describe('action.utils',()=>{
    it('parseEntries - ', ()=>{
        // GIVEN
        const state = createState([])

        // WHEN
        const entries = parseEntries(state, TEST_MOMENT)

        // THEN
        assert(entries.length === 0) // TODO chai assert
    })
})

const createState = (rawEntries)=>{
    return {
        days: {
            "2021-07-24" : [...rawEntries]
        }
    }
}