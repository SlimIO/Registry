// Require Node.js Dependencies
const { unlink, readFile } = require("fs").promises;
const { join } = require("path");

// Require Third-party Dependencies
const ava = require("ava");
const sqlite = require("sqlite");
const got = require("got");
const is = require("@slimio/is");
const argon2 = require("argon2");

// Require Internal Dependencies
const httpServer = require("../src/httpServer");

// CONSTANTS
const HTTP_PORT = 2777;
const HTTP_URL = new URL(`http://localhost:${HTTP_PORT}`);
const SRIPT_PATH = join(__dirname, "..", "scripts");
const DB_PATH = join(__dirname, "db_test.sqlite");

// Globals
let db;

ava.before(async(assert) => {
    db = await sqlite.open(DB_PATH);
    const sql = await readFile(join(SRIPT_PATH, "registry.sql"), { encoding: "utf8" });
    await db.exec(sql);

    // Hydrate DB
    const cryptPw = await argon2.hash("admin");
    const { lastID } = await db.run("INSERT INTO users (username, password) VALUES (?, ?)", "admin", cryptPw);
    await db.run("INSERT INTO addons (name, description, version, author, git) VALUES (?, ?, ?, ?, ?)",
        "cpu", "", "1.0.0", lastID, "http://github.com/");
    await db.run("INSERT INTO addons (name, description, version, author, git) VALUES (?, ?, ?, ?, ?)",
        "memory", "", "2.0.0", lastID, "http://github.com/");

    await new Promise((resolve) => {
        httpServer.use((req, res, next) => {
            req.db = db;
            next();
        });

        httpServer.listen(HTTP_PORT, resolve);
    });

    assert.pass();
});

ava.after(async(assert) => {
    await db.close();
    await unlink(DB_PATH);
    assert.pass();
});

ava("GET / must return uptime", async(assert) => {
    const { body } = await got(HTTP_URL, { json: true });

    assert.true(is.plainObject(body));
    assert.true(Reflect.has(body, "uptime"));
    assert.true(is.number(body.uptime));
    assert.deepEqual(Object.keys(body), ["uptime"]);
});

ava("GET /addons must return an array", async(assert) => {
    const { body } = await got(new URL("/addons", HTTP_URL), { json: true });

    assert.true(is.array(body));
    assert.deepEqual(["cpu", "memory"], body);
});

ava("GET /addons/cpu (must return 200)", async(assert) => {
    const { body } = await got(new URL("/addons/cpu", HTTP_URL), { json: true });

    assert.true(is.plainObject(body));
    assert.deepEqual(Object.keys(body), ["name", "description"]);
    assert.is(body.name, "cpu");
});

ava("GET /addons/blah (must return 500 - Addon not found)", async(assert) => {
    const error = await assert.throwsAsync(async() => {
        await got(new URL("/addons/blah", HTTP_URL), { json: true });
    });
    assert.is(error.statusCode, 500);
    assert.is(error.body.error, "Addon not found!");
});
