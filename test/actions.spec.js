const assert = require("assert");
const moment = require("moment");
const {
  assertState,
  assertStdOut,
  assertStdOutStartsWith,
  prepareContext,
} = require("./utils");

const { startTask, stopTask } = require("../src/actions/start-stop.ts");

const TEST_NOW = "1981-07-23-11:12";
const TEST_MOMENT = moment(TEST_NOW, "YYYY-MM-DD-HH:mm");

describe("actions", () => {
  describe("startTask", () => {
    it("adds an default task and logs", () => {
      // GIVEN
      const ctx = prepareContext({}, TEST_NOW, { defaultTask: "default" });

      // WHEN
      startTask(ctx)();

      // THEN
      assertStdOut(ctx, `Task default started at 11:12.\n`);
      assertState(ctx, {
        days: {
          "1981-07-23": ["11:12|start|default"],
        },
      });
    });

    it("adds an entry and logs", () => {
      // GIVEN
      const ctx = prepareContext({}, TEST_NOW, { defaultTask: "default" });

      // WHEN
      startTask(ctx)("13:37");

      // THEN
      assertStdOut(ctx, `Task default started at 13:37.\n`);
      assertState(ctx, {
        days: {
          "1981-07-23": ["13:37|start|default"],
        },
      });
    });

    it("no valid TimeInput, this must be a task", () => {
      // GIVEN
      const ctx = prepareContext({}, TEST_NOW);

      // WHEN
      startTask(ctx)("eat");

      // THEN
      assertStdOut(
        ctx,
        `Task eat started at ${TEST_MOMENT.format("HH:mm")}.\n`,
      );
      assertState(ctx, {
        days: {
          "1981-07-23": ["11:12|start|eat"],
        },
      });
    });

    it("adds and entry with override time", () => {
      // GIVEN
      const ctx = prepareContext({}, TEST_NOW);

      // WHEN
      startTask(ctx)("13:37", "eat");

      // THEN
      assertStdOut(ctx, `Task eat started at 13:37.\n`);
      assertState(ctx, {
        days: {
          "1981-07-23": ["13:37|start|eat"],
        },
      });
    });
  });

  describe("stopTask", () => {
    it("adds an entry and logs", () => {
      // GIVEN
      const ctx = prepareContext({}, TEST_NOW);

      // WHEN
      stopTask(ctx)();

      // THEN
      assertStdOut(ctx, `Task stopped at ${TEST_MOMENT.format("HH:mm")}.\n`);
      assertState(ctx, {
        days: {
          "1981-07-23": ["11:12|stop"],
        },
      });
    });

    it("adds an entry with overrideTime", () => {
      // GIVEN
      const ctx = prepareContext({}, TEST_NOW);

      // WHEN
      stopTask(ctx)("13:37");

      // THEN
      assertStdOut(ctx, `Task stopped at 13:37.\n`);
      assertState(ctx, {
        days: {
          "1981-07-23": ["13:37|stop"],
        },
      });
    });
  });

  describe("report", () => {
    it("", () => {});
  });
});
