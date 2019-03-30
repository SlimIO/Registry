// Require Node.js Dependencies
const { unlink } = require("fs").promises;
const { join } = require("path");

// Require Third-party Dependencies
const is = require("@slimio/is");
const argon2 = require("argon2");
const japa = require("japa");
const Sequelize = require("sequelize");
const { get, post } = require("httpie");

// Require Internal Dependencies
const models = require("../src/models");
const httpServer = require("../src/httpServer");

// CONSTANTS
const HTTP_PORT = 2777;
const HTTP_URL = new URL(`http://localhost:${HTTP_PORT}`);
const DB_PATH = join(__dirname, "db_test.db");

// Globals
let user;
let sequelize;

japa.group("Endpoints tests", (group) => {
    let accessToken = null;

    group.before(async() => {
        sequelize = new Sequelize(DB_PATH, "username", null, {
            storage: DB_PATH,
            dialect: "sqlite",
            logging: false
        });

        const tables = models(sequelize);
        await sequelize.sync({ force: true });

        // Hydrate DB
        user = (await tables.Users.create({
            username: "admin",
            password: await argon2.hash("admin")
        })).dataValues;

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
    });

    group.after(async() => {
        await sequelize.close();
        await unlink(DB_PATH);
    });

    japa("root endpoint must return uptime as JSON", async(assert) => {
        const { data, statusCode } = await get(HTTP_URL);
        assert.equal(statusCode, 200, "GET Request must return code 200");
        assert.equal(is.plainObject(data), true, "Returned data must be a plain Object");
        assert.deepEqual(Object.keys(data), ["uptime"], "Returned data must only have 'uptime' field");
        assert.equal(is.number(data.uptime), true, "uptime must be typeof number");
    });

    japa("/login with no body payload", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/login", HTTP_URL));
        }
        catch (err) {
            assert.equal(err.statusCode, 500, "POST Request must return code 500");
            assert.equal(is.array(err.data), true, "Returned data must be an Array");
        }
    });

    japa("/login with unknown username/password", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/login", HTTP_URL), {
                body: { username: "winni", password: "l'ourson" }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 500, "POST Request must return code 500");
            assert.equal(err.data, "User not found");
        }
    });

    japa("/login with an invalid password", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/login", HTTP_URL), {
                body: { username: "admin", password: "incorrect" }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 401, "POST Request must return code 401");
            assert.equal(err.data, "Invalid User Password");
        }
    });

    japa("/login with right username and password (must return an access_token)", async(assert) => {
        const { data, statusCode } = await post(new URL("/login", HTTP_URL), {
            body: { username: "admin", password: "admin" }
        });
        assert.equal(statusCode, 200, "POST Request must return code 200");
        assert.equal(is.plainObject(data), true, "Returned data must be a plain Object");
        assert.deepEqual(Object.keys(data), ["access_token"], "Returned data must only have 'access_token' field");
        assert.equal(is.string(data.access_token), true, "access_token must be typeof string");

        accessToken = data.access_token;
    });
});

