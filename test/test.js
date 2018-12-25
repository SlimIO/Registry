// Require Third-party Dependencies
const ava = require("ava");
const sqlite = require("sqlite");
const got = require("got");
const is = require("@slimio/is");

// Require Internal Dependencies
const httpServer = require("../src/httpServer");

// CONSTANTS
const HTTP_PORT = 2777;
const HTTP_URL = new URL(`http://localhost:${HTTP_PORT}`);

ava.before(async(assert) => {
    const db = await sqlite.open("../database.sqlite");

    await new Promise((resolve) => {
        httpServer.use((req, res, next) => {
            req.db = db;
            next();
        });

        httpServer.listen(HTTP_PORT, resolve);
    });

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
    const { body } = await got(HTTP_URL, { json: true });

    assert.true(is.array(body, "body is an array"));
    assert.true(Reflect.has(body, "addons"));
    assert.deepEqual(Object.keys(body), ["addons"]);
});
