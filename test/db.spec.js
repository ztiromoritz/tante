const db = require("../src/db");
const config = require("../src/config");
const fs = require("fs");
const assert = require("assert");
const tempDir = require("temp-dir");
const { prepareContext, assertStdError } = require("./utils");

const TEST_NOW = "1981-07-23-11:12";

describe("db", () => {
  beforeEach(() => {
    if (config.getTanteHomeDir().startsWith(tempDir)) {
      config.ensureDirs();
    } else {
      assert(false, "this test should only run in tempDir");
    }
  });

  afterEach(() => {
    // ensure that we are in test mode and using a temp dir
    if (config.getTanteHomeDir().startsWith(tempDir)) {
      fs.rmSync(config.getTanteHomeDir(), { recursive: true });
    } else {
      assert(
        false,
        "Test does not use temp directory. Set env variable TANTE_USE_TEST_HOME=true."
      );
    }
  });

  it("read", () => {
    // GIVEN
    fs.writeFileSync(config.getDatabaseFile(), '{"c":"d"}');

    // WHEN
    const state = db.readState();

    // THEN
    assert.deepEqual(state, { c: "d" });
  });

  it("write", () => {
    // WHEN
    db.writeState({ a: "b" });

    // THEN
    assert(
      fs.existsSync(config.getDatabaseFile()),
      "Database file does not exist."
    );
    const content = fs.readFileSync(config.getDatabaseFile());
    assert.deepEqual(JSON.parse(content), { a: "b" });
  });

  it("archive", () => {
    // GIVEN
    db.writeState({ a: "x" });
    const filename = config.getDatabaseFile();
    const archiveFilename = config.getDatabaseFile("-1981-07-23");
    const initialContent = fs.readFileSync(filename).toString();
    const ctx = prepareContext({}, TEST_NOW);

    // WHEN
    db.archive(ctx);

    // THEN
    assert(fs.existsSync(filename), "No db file left.");
    assert(fs.existsSync(archiveFilename), "No archive file created.");
    const archiveContent = fs.readFileSync(archiveFilename).toString();
    assert.equal(initialContent, archiveContent);
  });

  it("No archive twice", () => {
    const filename = config.getDatabaseFile();
    const ctx = prepareContext({}, TEST_NOW);
    db.archive(ctx);
    db.archive(ctx);

    // THEN
    assertStdError(ctx, "There was already an archive created today.\n");
  });
});
