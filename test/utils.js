const assert = require("assert");
const moment = require("moment");

const assertState = (context, expectedResult) => {
  assert.deepEqual(context._.changedState, expectedResult);
};

const assertStdOut = (context, expectedStr) => {
  assert.equal(context._.stdOut, expectedStr);
};

const assertStdOutStartsWith = (context, expectedStr) => {
  assert(
    context._.stdOut?.startsWith(expectedStr) ?? false,
    context._.stdOut?.substring(0, 50) +
      "\n   dont starts with  \n" +
      expectedStr,
  );
};

const assertStdError = (context, expectedStr) => {
  assert.equal(context._.stdError, expectedStr);
};

const prepareContext = (inputState, currentTime, _config) => {
  const _ = {
    changedState: null,
    stdOut: "",
    stdError: "",
  };
  const config = _config ?? {};
  const db = {
    readState: () => ({ ...inputState }),
    writeState: (changedState) => (_.changedState = changedState),
  };

  const logger = {
    log: (str) => {
      _.stdOut = `${_.stdOut}${str}\n`;
    },
    error: (str) => (_.stdError = `${_.stdError}${str}\n`),
  };

  const now = () => moment(currentTime, "YYYY-MM-DD-HH:mm");

  return {
    config,
    db,
    logger,
    now,
    _,
  };
};

module.exports = {
  assertState,
  assertStdOut,
  assertStdError,
  prepareContext,
  assertStdOutStartsWith,
};
