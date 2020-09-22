const assert = require('assert')
const moment = require('moment')
const {assertState, assertStdOut, prepareContext} = require("./utils");
const {startTask, stopTask, showStatus, showReport, configure, countdown} = require('../src/actions')


const TEST_NOW = "1981-07-23-11:12"
const TEST_MOMENT = moment(TEST_NOW, 'YYYY-MM-DD-HH:mm')

describe('actions', () => {
    describe('startTask', () => {
        it('adds an entry and logs', () => {
            // GIVEN
            const ctx = prepareContext({}, TEST_NOW)

            // WHEN
            startTask(ctx)('eat')

            // THEN
            assertStdOut(ctx, `Task eat started at ${TEST_MOMENT.format("HH:mm")}.\n`)
            assertState(ctx, {
                days: {
                    "1981-07-23": [
                        "11:12|start|eat"
                    ]
                }
            })
        })

        it('adds and entry with override time', ()=>{
            // GIVEN
            const ctx = prepareContext({}, TEST_NOW)

            // WHEN
            startTask(ctx)('eat', '13:37')

            // THEN
            assertStdOut(ctx, `Task eat started at 13:37.\n`)
            assertState(ctx,{
                days: {
                    "1981-07-23" : [
                        "13:37|start|eat"
                    ]
                }
            })
        })

    })

    describe('stopTask', () => {
        it('adds an entry and logs', () => {
            // GIVEN
            const ctx = prepareContext({}, TEST_NOW)

            // WHEN
            stopTask(ctx)()

            // THEN
            assertStdOut(ctx, `Task stopped at ${TEST_MOMENT.format("HH:mm")}.\n`)
            assertState(ctx, {
                days: {
                    "1981-07-23": [
                        "11:12|stop"
                    ]
                }
            })
        })

        it('adds an entry with overrideTime', ()=>{
            // GIVEN
            const ctx = prepareContext({}, TEST_NOW)

            // WHEN
            stopTask(ctx)('13:37')

            // THEN
            assertStdOut(ctx, `Task stopped at 13:37.\n`)
            assertState(ctx, {
                days: {
                    "1981-07-23": [
                        "13:37|stop"
                    ]
                }
            })
        })
    })

    describe('status', () => {
        it('no running task for empty entries', () => {
            // GIVEN
            const ctx = prepareContext({}, TEST_NOW)

            // WHEN
            showStatus(ctx)()

            assertStdOut(ctx, 'No task is running.\n')

        })

        it('no running task if last entry is stop', () => {
            // GIVEN
            const ctx = prepareContext({
                days: {
                    "1981-07-23": [
                        "11:30|start|eat",
                        "12:20|stop"
                    ]
                }
            }, TEST_NOW)

            // WHEN
            showStatus(ctx)()

            // THEN
            assertStdOut(ctx, 'No task is running.\n')
        })

        it('last task shown as running', () => {
            // GIVEN
            const ctx = prepareContext({
                days: {
                    "1981-07-23": [
                        "11:30|start|eat",
                        "12:30|start|drink"
                    ]
                }
            }, TEST_NOW)

            // WHEN
            showStatus(ctx)()

            // THEN
            assertStdOut(ctx, "Task 'drink' is running since 12:30.\n")

        })
    })

    describe('report', ()=>{
        it('', ()=>{

        })
    })


})


