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
        const user = await tables.Users.create({
            username: "admin",
            password: await argon2.hash("admin1953")
        });

        await tables.Users.create({
            username: "alexandre",
            password: await argon2.hash("admin1953")
        });

        const org = await tables.Organisation.create({
            name: "SlimIO",
            description: "SlimIO Official Organisation",
            ownerId: user.id
        });

        await tables.Addons.create({
            name: "cpu",
            description: "CPU Addon",
            version: "1.2.0",
            authorId: user.id,
            git: "https://github.com/SlimIO/cpu-addon"
        });

        await tables.Addons.create({
            name: "memory",
            description: "Memory Addon",
            version: "1.0.0",
            authorId: user.id,
            git: "http://github.com/",
            organisationId: org.id
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

    japa("/users with no body payload", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/users", HTTP_URL));
        }
        catch (err) {
            assert.equal(err.statusCode, 500, "POST Request must return code 500");
            assert.equal(is.array(err.data), true, "Returned data must be an Array");
        }
    });

    japa("/users with a username already taken", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/users", HTTP_URL), {
                body: { username: "admin", password: "admin1953" }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 500, "POST Request must return code 500");
            assert.equal(err.data, "The 'admin' username is already in use");
        }
    });

    japa("/users create 'fraxken' user", async(assert) => {
        const { data, statusCode } = await post(new URL("/users", HTTP_URL), {
            body: { username: "fraxken", password: "p@ssword" }
        });
        assert.equal(statusCode, 201, "POST Request must return code 201");
        assert.equal(is.plainObject(data), true, "Returned data must be a plain Object");
        assert.deepEqual(Object.keys(data), ["userId"], "Returned data must only have 'userId' field");
        assert.equal(is.number(data.userId), true, "userId must be typeof number");
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

    japa("/login with 'fraxken' user (must return an access_token)", async(assert) => {
        const { data, statusCode } = await post(new URL("/login", HTTP_URL), {
            body: { username: "fraxken", password: "p@ssword" }
        });
        assert.equal(statusCode, 200, "POST Request must return code 200");
        assert.equal(is.plainObject(data), true, "Returned data must be a plain Object");
        assert.deepEqual(Object.keys(data), ["access_token"], "Returned data must only have 'access_token' field");
        assert.equal(is.string(data.access_token), true, "access_token must be typeof string");

        accessToken = data.access_token;
    });

    japa("/addon (Retrieve all available addons)", async(assert) => {
        const { data, statusCode } = await get(new URL("/addon", HTTP_URL));
        assert.equal(statusCode, 200, "POST Request must return code 200");
        assert.equal(is.array(data), true, "Returned data must be an Array");
        assert.deepEqual(data, ["cpu", "memory"]);
    });

    japa("/addon/:addonName (invalid params)", async(assert) => {
        assert.plan(2);

        try {
            await get(new URL("/addon/s", HTTP_URL));
        }
        catch (err) {
            assert.equal(err.statusCode, 500, "POST Request must return code 500");
            assert.equal(is.array(err.data), true, "Returned data must be an Array");
        }
    });

    japa("/addon/:addonName (Unable to found Addon)", async(assert) => {
        assert.plan(2);

        try {
            await get(new URL("/addon/myAddon", HTTP_URL));
        }
        catch (err) {
            assert.equal(err.statusCode, 500, "POST Request must return code 500");
            assert.equal(err.data, "Unable to found Addon 'myAddon'");
        }
    });

    japa("/addon/:addonName (Retrieve a given addon by his name)", async(assert) => {
        const { data, statusCode } = await get(new URL("/addon/cpu", HTTP_URL));
        assert.equal(statusCode, 200, "POST Request must return code 200");
        assert.equal(is.plainObject(data), true, "Returned data must be a plain Object");

        assert.deepEqual(Object.keys(data), [
            "name", "description", "git", "createdAt", "updatedAt", "author", "versions", "organisation"
        ]);
        assert.equal(data.name, "cpu");
        assert.equal(data.git, "https://github.com/SlimIO/cpu-addon");
        assert.equal(data.author.username, "admin");
    });

    japa("/organisation (Retrieve all organisations)", async(assert) => {
        const { data, statusCode } = await get(new URL("/organisation", HTTP_URL));
        assert.equal(statusCode, 200, "POST Request must return code 200");
        assert.equal(is.plainObject(data), true, "Returned data must be a plain Object");

        assert.deepEqual(Object.keys(data), ["SlimIO"], "SlimIO organisation must be the only organisation");

        const SlimIO = data.SlimIO;
        assert.deepEqual(Object.keys(SlimIO), ["description", "owner", "users", "addons"]);
        assert.equal(SlimIO.description, "SlimIO Official Organisation");
        assert.equal(SlimIO.owner, "admin");
        assert.equal(SlimIO.users.length, 0);
        assert.equal(SlimIO.addons.length, 1);
        assert.equal(SlimIO.addons[0], "memory");
    });

    japa("/organisation/unknown (Organisation Not Found)", async(assert) => {
        assert.plan(2);

        try {
            await get(new URL("/organisation/unknown", HTTP_URL));
        }
        catch (err) {
            assert.equal(err.statusCode, 500, "POST Request must return code 500");
            assert.equal(err.data, "Organisation 'unknown' Not Found");
        }
    });

    japa("/organisation/SlimIO (assert return values)", async(assert) => {
        const { data, statusCode } = await get(new URL("/organisation/SlimIO", HTTP_URL));
        assert.equal(statusCode, 200, "POST Request must return code 200");
        assert.equal(is.plainObject(data), true, "Returned data must be a plain Object");

        assert.deepEqual(Object.keys(data), [
            "name", "description", "createdAt", "updatedAt", "owner", "users", "addons"
        ]);
        assert.equal(data.name, "SlimIO");
        assert.equal(data.description, "SlimIO Official Organisation");
        assert.equal(data.owner.username, "admin");
        assert.equal(is.array(data.users), true);
        assert.equal(is.array(data.addons), true);
    });

    japa("/addon/publish (Invalid token)", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/addon/publish", HTTP_URL), {
                headers: { authorization: "blouh!" }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 401, "POST Request must return code 401");
            assert.equal(err.data, "Invalid Token");
        }
    });

    japa("/addon/publish with no body payload", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/addon/publish", HTTP_URL), {
                body: {},
                headers: { authorization: accessToken }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 500, "POST Request must return code 500");
            assert.equal(is.array(err.data), true, "Returned data must be an Array");
        }
    });

    japa("/addon/publish (Publish an addon as 'fraxken')", async(assert) => {
        {
            const { data, statusCode } = await post(new URL("/addon/publish", HTTP_URL), {
                body: {
                    name: "network",
                    description: "Network Addon",
                    version: "0.1.0",
                    git: "https://github.com/SlimIO"
                },
                headers: {
                    authorization: accessToken
                }
            });

            assert.equal(statusCode, 201, "POST Request must return code 201");
            assert.equal(is.plainObject(data), true, "Returned data must be a plain Object");
            assert.deepEqual(Object.keys(data), ["addonId"]);
            assert.equal(is.number(data.addonId), true);
            assert.equal(data.addonId, 3);
        }

        const { data, statusCode } = await get(new URL("/addon/network", HTTP_URL));
        assert.equal(statusCode, 200, "POST Request must return code 200");
        assert.equal(is.plainObject(data), true, "Returned data must be a plain Object");

        assert.equal(data.name, "network");
        assert.equal(data.author.username, "fraxken");
    });

    japa("/addon/publish (Publish network addon with 'alexandre' Account)", async(assert) => {
        assert.plan(2);
        const { data: ret } = await post(new URL("/login", HTTP_URL), {
            body: { username: "alexandre", password: "admin1953" }
        });

        try {
            await post(new URL("/addon/publish", HTTP_URL), {
                body: {
                    name: "network",
                    description: "Network Addon",
                    version: "0.1.0",
                    git: "https://github.com/SlimIO"
                },
                headers: {
                    authorization: ret.access_token
                }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 500, "POST Request must return code 500");
            assert.equal(err.data, "Addon 'network' already in use");
        }
    });

    japa("/addon/publish (Publish - version must be greater)", async(assert) => {
        try {
            await post(new URL("/addon/publish", HTTP_URL), {
                body: {
                    name: "network",
                    description: "Network Addon",
                    version: "0.1.0",
                    git: "https://github.com/SlimIO"
                },
                headers: {
                    authorization: accessToken
                }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 500, "POST Request must return code 500");
            assert.equal(err.data, "Addon version must be greater than '0.1.0'");
        }
    });
});

