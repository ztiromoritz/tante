const assert = require('assert')
const dayjs = require('dayjs')
const {startTask, stopTask, showStatus, showReport, configure, countdown} = require('../src/actions')


const TEST_NOW = "1981-07-23-11:12"
const TEST_MOMENT = dayjs(TEST_NOW, 'YYYY-MM-DD-HH:mm')

describe('actions', () => {
    describe('startTask', () => {
        it('adds an entry and logs', () => {
            // GIVEN
            const ctx = prepareContext({}, TEST_NOW);

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

    })

    describe('stopTask', () => {
        it('adds and entry and logs', () => {
            // GIVEN
            const ctx = prepareContext({}, TEST_NOW)

            // WHEN
            stopTask(ctx)()

            // THEN
            assertStdOut(ctx, `Task stopped.\n`)
            assertState(ctx, {
                days: {
                    "1981-07-23": [
                        "11:12|stop"
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

})


const assertState = (context, expectedResult) => {
    assert.deepEqual(context._.changedState, expectedResult);
}

const assertStdOut = (context, expectedStr) => {
    assert.equal(context._.stdOut, expectedStr);
}

const prepareContext = (inputState, currentTime) => {

    const _ = {
        changedState: null,
        stdOut: '',
        stdError: ''
    }
    const config = {}
    const db = {
        readState: () => ({...inputState}),
        writeState: (changedState) => _.changedState = changedState
    }

    const logger = {
        log: (str) => {_.stdOut = `${_.stdOut}${str}\n`},
        error: (str) => _.stdError = `${_.stdError}${str}\n`
    }

    const now = () => dayjs(currentTime, 'YYYY-MM-DD-HH:mm')

    return {
        config,
        db,
        logger,
        now,
        _
    }
}