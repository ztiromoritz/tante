const moment = require("moment");
const assert = require("assert").strict;
const {
  parseEntries,
  formatDuration,
  parseDayInput,
  allDaysInRange,
} = require("../src/action.utils");
const TEST_NOW = "2021-07-24-18:03";
const TEST_MOMENT = moment(TEST_NOW, "YYYY-MM-DD-HH:mm");

describe("action.utils", () => {
  describe("parseEntries", () => {
    it("empty", () => {
      // GIVEN
      const state = createState([]);

      // WHEN
      const entries = parseEntries(state, TEST_MOMENT);

      // THEN
      // assert(entries.length === 0) // TODO chai assert
    });

    it("open task in future", () => {
      const state = createState(["23:00|start|dodo"]);
      const entries = parseEntries(state, TEST_MOMENT);
      assert.deepEqual(entries, [{ from: "23:00", name: "dodo" }]);
    });

    it("only stop", () => {
      const state = createState(["01:00|stop"]);
      const entries = parseEntries(state, TEST_MOMENT);
      assert.deepEqual(entries, []);
    });

    it("same-time order wins", () => {});

    it("last entry is currently running", () => {
      // GIVEN
      const state = createState([
        "09:29|start|abc",
        "13:47|stop",
        "18:00|start|def",
      ]);

      // WHEN
      const entries = parseEntries(state, TEST_MOMENT);
      // THEN
      assert.deepEqual(entries, [
        { from: "09:29", to: "13:47", name: "abc", duration: "04:18" },
        { from: "18:00", toNow: "18:03", name: "def", durationNow: "00:03" },
      ]);
    });

    it("interesting example 1", () => {
      // GIVEN
      const state = createState([
        "09:29|start|abc",
        "13:47|stop",
        "20:41|start|abc",
        "20:43|stop",
      ]);

      // WHEN
      const entries = parseEntries(state, TEST_MOMENT);

      // THEN
      assert.deepEqual(entries, [
        { from: "09:29", to: "13:47", name: "abc", duration: "04:18" },
        { from: "20:41", to: "20:43", name: "abc", duration: "00:02" },
      ]);
    });

    it("interesting example 1 - stutter", () => {
      // GIVEN
      const state = createState([
        "09:29|start|abc",
        "13:47|stop",
        "20:41|start|abc",
        "20:43|start|abc",
        "20:43|stop",
        "20:43|stop",
      ]);

      // WHEN
      const entries = parseEntries(state, TEST_MOMENT);

      // THEN
      assert.deepEqual(entries, [
        { from: "09:29", to: "13:47", name: "abc", duration: "04:18" },
        { from: "20:41", to: "20:43", name: "abc", duration: "00:02" },
      ]);
    });
  });

  describe("formatDuration", () => {
    it("simple", () => {
      const duration = moment.duration(0).add(3, "hours").add(11, "minutes");

      const result = formatDuration(duration);

      assert.equal(result, "03:11");
    });

    it("minute overflow", () => {
      const duration = moment.duration(0).add(3, "hours").add(70, "minutes");

      const result = formatDuration(duration);

      assert.equal(result, "04:10");
    });

    it("hour overflow", () => {
      const duration = moment.duration(0).add(25, "hours").add(10, "minutes");

      const result = formatDuration(duration);

      assert.equal(result, "25:10");
    });

    it("negative (duration has now sign)", () => {
      const duration = moment.duration(0).subtract(25, "minutes");

      const result = formatDuration(duration);

      assert.equal(result, "00:25");
    });

    it("negative minute overflow", () => {
      const duration = moment.duration(0).subtract(70, "minutes");

      const result = formatDuration(duration);

      assert.equal(result, "01:10");
    });

    it("negative overflow", () => {
      const duration = moment
        .duration(0)
        .subtract(23, "hours")
        .subtract(62, "minutes");

      const result = formatDuration(duration);

      assert.equal(result, "24:02");
    });

    it("negative hour overflow", () => {
      const duration = moment.duration(0).subtract(25, "hours");

      const result = formatDuration(duration);

      assert.equal(result, "25:00");
    });
  });

  describe("parseDayInput", () => {
    const assertMessage = (expected, result) =>
      `${expected.toISOString()} isSameDay as ${result.toISOString()}`;

    it("2022-12-23", () => {
      const result = parseDayInput("2022-12-23");
      const expected = moment("2022-12-23");

      assert(result.isValid(), "Is valid");
      assert(expected.isSame(result, "day"), assertMessage(expected, result));
    });
    it("23.12.2022", () => {
      const result = parseDayInput("23.12.2022");
      const expected = moment("23.12.2022", "DD.MM.YYYY");
      assert(result.isValid(), "Is valid");
      assert(expected.isSame(result, "day"), assertMessage(expected, result));
    });
    it("23.12.", () => {
      const expected = moment("23.12.2001", "DD.MM.YYYY");
      const result = parseDayInput("23.12.", expected);
      assert(result.isValid(), "Is valid");
      assert(result.get("year") === 2001, "Year set to given now");
      assert(expected.isSame(result, "day"), assertMessage(expected, result));
    });

    it("23.12. without now", () => {
      const result = parseDayInput("23.12.");
      const expected = moment("23.12.", "DD.MM.YYYY");
      assert(result.isValid(), "Is valid");
      assert(expected.isSame(result, "day"), assertMessage(expected, result));
    });

    it("1.1.2021 short days/months", () => {
      const result = parseDayInput("1.1.2021");
      const expected = moment("1.1.2021", "DD.MM.YYYY");
      assert(result.isValid(), "Is valid");
      assert(expected.isSame(result, "day"), assertMessage(expected, result));
    });

    it("1.1. short days/months", () => {
      const result = parseDayInput("1.1.");
      const expected = moment("1.1.", "DD.MM.YYYY");
      assert(result.isValid(), "Is valid");
      assert(expected.isSame(result, "day"), assertMessage(expected, result));
    });

    it("01.01. zero padded", () => {
      const result = parseDayInput("01.01.");
      const expected = moment("01.01.", "DD.MM.YYYY");
      assert(result.isValid(), "Is valid");
      assert(expected.isSame(result, "day"), assertMessage(expected, result));
    });

    it("101.01. garbage", () => {
      const result = parseDayInput("101.01.");
      assert(!result.isValid(), "Is not valid" + result);
    });
    it("~4", () => {
      const result = parseDayInput("~4");
      const expected = moment().subtract(4, "day");
      assert(result.isValid(), "Is valid");
      assert(expected.isSame(result, "day"), assertMessage(expected, result));
    });
    it("0", () => {
      const result = parseDayInput("0");
      const expected = moment();
      assert(result.isValid(), "Is valid" + result);
      assert(expected.isSame(result, "day"), assertMessage(expected, result));
    });
    it("3", () => {
      const result = parseDayInput("3");
      const expected = moment().add(3, "day");
      assert(result.isValid(), "Is valid");
      assert(expected.isSame(result, "day"), assertMessage(expected, result));
    });
    it("+4", () => {
      const result = parseDayInput("+4");
      const expected = moment().add(4, "day");
      assert(result.isValid(), "Is valid");
      assert(expected.isSame(result, "day"), assertMessage(expected, result));
    });
    it("~4 with given now", () => {
      const now = moment("2001-01-23");
      const result = parseDayInput("~4", now);

      const expected = now.clone().add(-4, "day");

      assert(result.isValid(), "Is valid");
      assert(expected.isSame(result, "day"), assertMessage(expected, result));
    });
    it("2022-12 missing day", () => {
      const result = parseDayInput("2022-12");
      assert(!result.isValid(), "Is not valid" + result);
    });
    it("23. missing day", () => {
      const result = parseDayInput("23.");
      assert(!result.isValid(), "Is not valid" + result);
    });
    it("-2. garbage 1", () => {
      const result = parseDayInput("-2.");
      assert(!result.isValid(), "Is not valid" + result);
    });
  });

  describe("allDaysInRange", () => {
    it("one day", () => {
      const result = allDaysInRange(moment("2022-12-23"), moment("2022-12-23"));
      assert(result.length === 1, "one day " + result.length);
    });

    it("empty", () => {
      const result = allDaysInRange(moment("2022-12-24"), moment("2022-12-23"));
      assert(result.length === 0, "from after to " + result.length);
    });

    it("two days", () => {
      const result = allDaysInRange(moment("2022-12-23"), moment("2022-12-24"));
      assert(result.length === 2, "two days " + result.length);
    });
  });
});

const createState = (rawEntries) => {
  return {
    days: {
      "2021-07-24": [...rawEntries],
    },
  };
};
