// Require Node.js Dependencies
const { unlink, readFile } = require("fs").promises;
const { join } = require("path");

// Require Third-party Dependencies
const ava = require("ava");
const got = require("got");
const is = require("@slimio/is");
const argon2 = require("argon2");
const Sequelize = require("sequelize");
const models = require("../src/models");

// Require Internal Dependencies
const httpServer = require("../src/httpServer");

// CONSTANTS
const HTTP_PORT = 2777;
const HTTP_URL = new URL(`http://localhost:${HTTP_PORT}`);
const DB_PATH = join(__dirname, "db_test.db");

// maria|sqlite
const DB = "maria";

// Globals
let sequelize;
let user;
const headers = {
    authorization: null
};

ava.before(async(assert) => {
    if (DB === "maria") {
        sequelize = new Sequelize("test", "root", "root", {
            dialect: "mysql",
            logging: false
        });
    }
    else if (DB === "sqlite") {
        sequelize = new Sequelize(DB_PATH, "username", null, {
            storage: DB_PATH,
            dialect: "sqlite",
            logging: false
        });
    }
    else {
        sequelize = new Sequelize(DB_PATH, "username", null, {
            storage: DB_PATH,
            dialect: "sqlite",
            logging: false
        });
    }

    const tables = models(sequelize);
    // await initTables(tables, true);
    await sequelize.sync({ force: true });

    // Hydrate DB
    const cryptPw = await argon2.hash("admin");
    user = await tables.Users.create({
        username: "admin",
        password: cryptPw
    });

    await tables.Addons.create({
        name: "cpu",
        description: "",
        version: "1.0.0",
        authorId: user.id,
        git: "http://github.com/"
    });
    await tables.Addons.create({
        name: "memory",
        description: "",
        version: "1.0.0",
        authorId: user.id,
        git: "http://github.com/"
    });

    await new Promise((resolve) => {
        httpServer.use((req, res, next) => {
            Object.assign(req, tables);
            next();
        });

        httpServer.listen(HTTP_PORT, resolve);
    });

    const login = { username: "admin", password: "admin" };
    const { body } = await got.post(new URL("/login", HTTP_URL), { body: login, json: true });
    headers.authorization = body.access_token;

    assert.pass();
});

/*
ava.after(async(assert) => {
    // sequelize.connectionManager.connections.default.close();
    // await sequelize.connectionManager.close();
    await sequelize.close();
    if (DB === "sqlite") {
        await unlink(DB_PATH);
    }
    assert.pass();
});

ava("POST /organisation (must return 200)", async(assert) => {
    const organisation = { name: "SlimIO" };
    const { body } = await got.post(new URL("/organisation", HTTP_URL), {
        headers,
        body: organisation,
        json: true
    });

    // const { body: res } = await got(new URL("/organisation/SlimIO", HTTP_URL), { json: true });
    // console.log(JSON.stringify(res, null, 4));

    assert.true(is.plainObject(body));
    assert.true(is.number(body.organisationId));
});

ava("get /organisation (must return 200)", async(assert) => {
    const { body } = await got(new URL("/organisation/SlimIO", HTTP_URL), { json: true });
    console.log(body);

    assert.true(is.plainObject(body));
});


ava("GET /users (must return 200)", async(assert) => {
    const { body } = await got(new URL("/users", HTTP_URL), { json: true });

    assert.true(is.array(body));
    assert.deepEqual(body.length, 1);
});

ava("GET /users/admin (must return 200)", async(assert) => {
    const { body } = await got(new URL("/users/admin", HTTP_URL), { json: true });

    assert.true(is.plainObject(body));
    assert.is(body.addons.length, 2);
    assert.deepEqual(Object.keys(body), [
        "id",
        "username",
        "password",
        "createdAt",
        "updatedAt",
        "addons"
    ]);
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

    console.log(body);
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

ava("POST /login (must return 200)", async(assert) => {
    const login = { username: "admin", password: "admin" };

    const { body } = await got.post(new URL("/login", HTTP_URL), { body: login, json: true });

    assert.deepEqual(Object.keys(body), ["access_token"]);
});

ava("POST /login wrong password", async(assert) => {
    const body = { username: "admin", password: "test" };

    const error = await assert.throwsAsync(async() => {
        await got.post(new URL("/login", HTTP_URL), { body, json: true });
    });
    assert.is(error.statusCode, 401);
    assert.is(error.body, "Invalid User Password");
});

ava("POST /login User not found", async(assert) => {
    const body = { username: "test", password: "test" };

    const error = await assert.throwsAsync(async() => {
        await got.post(new URL("/login", HTTP_URL), { body, json: true });
    });
    assert.is(error.statusCode, 401);
    assert.is(error.body, "User not found");
});

ava("POST /publishAddon Invalid Token (must return 402)", async(assert) => {
    const login = { username: "admin", password: "admin" };
    const addon = {
        name: "network-interface",
        version: "1.2.3",
        git: "http://github.com/"
    };

    const { body } = await got.post(new URL("/login", HTTP_URL), { body: login, json: true });

    const error = await assert.throwsAsync(async() => {
        await got.post(new URL("/publishAddon", HTTP_URL), {
            headers: {
                authorization: body.access_token + 1
            },
            body: addon,
            json: true
        });
    });

    assert.is(error.statusCode, 402);
    assert.is(error.body, "Invalid Token");
});


ava("POST /publishAddon SequelizeValidationError (must return 500)", async(assert) => {
    const login = { username: "admin", password: "admin" };
    const addon = {
        name: "n",
        version: "1.2.3",
        git: "http://github.com/"
    };

    const { body } = await got.post(new URL("/login", HTTP_URL), { body: login, json: true });

    const error = await assert.throwsAsync(async() => {
        await got.post(new URL("/publishAddon", HTTP_URL), {
            headers: {
                authorization: body.access_token
            },
            body: addon,
            json: true
        });
    });

    assert.is(error.statusCode, 500);
    assert.is(error.body.name, "SequelizeValidationError");
    assert.is(error.body.errors[0].message, "Validation len on name failed");
});

ava("POST /login & /publishAddon (must return 200)", async(assert) => {
    const login = { username: "admin", password: "admin" };
    const addon = {
        name: "network-interface",
        version: "1.2.3",
        git: "http://github.com/"
    };

    const { body } = await got.post(new URL("/login", HTTP_URL), { body: login, json: true });

    const result = await got.post(new URL("/publishAddon", HTTP_URL), {
        headers: {
            authorization: body.access_token
        },
        body: addon,
        json: true
    });

    assert.pass();
});
*/
