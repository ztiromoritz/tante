const moment = require('moment')
const assert = require('assert').strict
const {parseEntries, formatDuration} = require("../src/action.utils");
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

        it('open task in future', ()=>{
            const state = createState(["23:00|start|dodo"])
            const entries = parseEntries(state, TEST_MOMENT)
            assert.deepEqual(entries, [{from: "23:00", name: "dodo"}])
        })

        it('only stop', ()=>{
            const state = createState(["01:00|stop"])
            const entries = parseEntries(state, TEST_MOMENT)
            assert.deepEqual(entries, [])
        })


        it("same-time order wins", ()=>{

        })


        it("last entry is currently running", ()=>{
            // GIVEN
            const state = createState([
                "09:29|start|abc",
                "13:47|stop",
                "18:00|start|def"])

            // WHEN
            const entries = parseEntries(state, TEST_MOMENT)
            // THEN
            assert.deepEqual(entries, [
                {from: "09:29", to: "13:47", name: "abc", duration: "04:18"},
                {from: "18:00", toNow: "18:03", name: "def", durationNow: "00:03"}
            ])
        })

        it('interesting example 1', ()=>{
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

    describe('formatDuration', ()=>{
        it('simple', ()=>{
            const duration = moment.duration(0).add(3,'hours').add(11,'minutes');

            const result = formatDuration(duration);

            assert.equal(result, '03:11');
        })

        it('minute overflow', ()=>{
            const duration = moment.duration(0).add(3,'hours').add(70,'minutes');

            const result = formatDuration(duration);

            assert.equal(result, '04:10');
        })


        it('hour overflow', ()=>{
            const duration = moment.duration(0).add(25,'hours').add(10,'minutes');

            const result = formatDuration(duration);

            assert.equal(result, '25:10');
        })

        it('negative (duration has now sign)', ()=>{
            const duration = moment.duration(0).subtract(25,'minutes');

            const result = formatDuration(duration);

            assert.equal(result, '00:25');
        })

        it('negative minute overflow', ()=>{
            const duration = moment.duration(0).subtract(70,'minutes');

            const result = formatDuration(duration);

            assert.equal(result, '01:10');
        })

        it('negative overflow', ()=>{
            const duration = moment.duration(0).subtract(23,'hours').subtract(62,'minutes');

            const result = formatDuration(duration);

            assert.equal(result, '24:02');
        })

        it('negative hour overflow', ()=>{
            const duration = moment.duration(0).subtract(25,'hours');

            const result = formatDuration(duration);

            assert.equal(result, '25:00');
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