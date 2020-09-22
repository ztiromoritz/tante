const moment = require('moment')
const assert = require('assert').strict
const {parseEntries} = require("../src/action.utils");
const TEST_NOW = "2021-07-24-18:03"
const TEST_MOMENT = moment(TEST_NOW, 'YYYY-MM-DD-HH:mm')

describe('action.utils',()=>{

    describe("parseEntries", ()=>{
        it('empty', ()=>{
            // GIVEN
            const state = createState([])

            // WHEN
            const entries = parseEntries(state, TEST_MOMENT)

            // THEN
            // assert(entries.length === 0) // TODO chai assert
        })

        it('open task', ()=>{
            const state = createState(["01:00|start|dodo"])
            const entries = parseEntries(state, TEST_MOMENT)
            assert.deepEqual(entries, [{from: "01:00", name: "dodo"}])
        })

        it('only stop', ()=>{
            const state = createState(["01:00|stop"])
            const entries = parseEntries(state, TEST_MOMENT)
            assert.deepEqual(entries, [])
        })


        it("same-time order wins", ()=>{

        })

        it('nteresting example 1', ()=>{
            // GIVEN
            const state = createState([
                "09:29|start|abc",
                "13:47|stop",
                "20:41|start|abc",
                "20:43|stop"])

            // WHEN
            const entries = parseEntries(state, TEST_MOMENT)

            // THEN
            assert.deepEqual(entries, [
                {from: "09:29", to: "13:47", name: "abc", duration: "04:18"},
                {from: "20:41", to: "20:43", name: "abc", duration: "00:02"}
            ])
        })

        it('interesting example 1 - stutter', ()=>{
            // GIVEN
            const state = createState([
                "09:29|start|abc",
                "13:47|stop",
                "20:41|start|abc",
                "20:43|start|abc",
                "20:43|stop",
                "20:43|stop"])

            // WHEN
            const entries = parseEntries(state, TEST_MOMENT)

            // THEN
            assert.deepEqual(entries, [
                {from: "09:29", to: "13:47", name: "abc", duration: "04:18"},
                {from: "20:41", to: "20:43", name: "abc", duration: "00:02"}
            ])
        })
    })

})

const createState = (rawEntries)=>{
    return {
        days: {
            "2021-07-24" : [...rawEntries]
        }
    }
}