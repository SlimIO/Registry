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
    let adminToken = null;
    let tokenTable = null;

    group.before(async() => {
        sequelize = new Sequelize(DB_PATH, "username", null, {
            storage: DB_PATH,
            dialect: "sqlite",
            logging: false
        });

        const tables = models(sequelize);
        await sequelize.sync({ force: true });
        tokenTable = tables.Tokens;

        // Hydrate DB
        const user = await tables.Users.create({
            username: "admin",
            active: true,
            email: "admin.mail@gmail.com",
            password: await argon2.hash("admin1953")
        });

        await tables.Users.create({
            username: "alexandre",
            active: true,
            email: "alexandre.malaj@gmail.com",
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
            latest: "1.2.0",
            version: {
                version: "1.2.0",
                git: "https://github.com/SlimIO/cpu-addon"
            },
            authorId: user.id,
        });

        await tables.Addons.create({
            name: "memory",
            description: "Memory Addon",
            latest: "1.0.0",
            version: {
                version: "1.0.0",
                git: "http://github.com/"
            },
            authorId: user.id,
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
            assert.equal(err.statusCode, 400, "POST Request must return code 400");
            assert.equal(is.string(err.data), true, "Returned data must be an string");
        }
    });

    japa("/users with a username already taken", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/users", HTTP_URL), {
                body: { username: "admin", email: "admin.mail@gmail.com", password: "admin1953" }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 500, "POST Request must return code 500");
            assert.equal(err.data.errors[0].message, "An account is already registered with this given email or username.");
        }
    });

    japa("/users create 'fraxken' user", async(assert) => {
        {
            const { data, statusCode } = await post(new URL("/users", HTTP_URL), {
                body: { username: "fraxken", email: "gentilhomme.thomas@gmail.com", password: "p@ssword" }
            });
            assert.equal(statusCode, 201, "POST Request must return code 201");
            assert.deepEqual(data, {}, "Return an empty Object");
        }

        // Retrieve the token and active it for the sake of the test suite
        {
            const [row] = await tokenTable.findAll();

            const { data, statusCode } = await post(new URL("/users/activeAccount", HTTP_URL), {
                body: { token: row.token }
            });
            assert.equal(statusCode, 200, "POST Request must return code 200");
            assert.deepEqual(data, {}, "Return an empty Object");
        }

        const tokens = await tokenTable.findAll();
        assert.equal(tokens.length, 0, "There must be no tokens left!");
    }).timeout(9000);

    japa("/login with no body payload", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/login", HTTP_URL));
        }
        catch (err) {
            assert.equal(err.statusCode, 400, "POST Request must return code 400");
            assert.equal(is.string(err.data), true, "Returned data must be a string");
        }
    });

    japa("/login with unknown username/password", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/login", HTTP_URL), {
                body: { username: "winni", email: "unknown@gmail.com", password: "l'ourson" }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 400, "POST Request must return code 400");
            assert.equal(err.data.errors[0].message, "Unable to authenticate the given user");
        }
    });

    japa("/login with an invalid password", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/login", HTTP_URL), {
                body: { username: "admin", email: "admin.mail@gmail.com", password: "incorrect" }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 400, "POST Request must return code 400");
            assert.equal(err.data.errors[0].message, "Unable to authenticate the given user");
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
            assert.equal(err.statusCode, 400, "POST Request must return code 400");
            assert.equal(is.string(err.data), true, "Returned data must be a string");
        }
    });

    japa("/addon/:addonName (Unable to found Addon)", async(assert) => {
        assert.plan(2);

        try {
            await get(new URL("/addon/myAddon", HTTP_URL));
        }
        catch (err) {
            assert.equal(err.statusCode, 404, "POST Request must return code 404");
            assert.equal(err.data.errors[0].message, "Unable to found Addon 'myAddon'");
        }
    });

    japa("/addon/:addonName (Retrieve a given addon by his name)", async(assert) => {
        const { data, statusCode } = await get(new URL("/addon/cpu", HTTP_URL));
        assert.equal(statusCode, 200, "POST Request must return code 200");
        assert.equal(is.plainObject(data), true, "Returned data must be a plain Object");

        assert.deepEqual(Object.keys(data).sort(), [
            "name", "description", "latest", "createdAt", "updatedAt", "author", "versions", "organisation"
        ].sort());
        assert.equal(data.name, "cpu");
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
            assert.equal(err.statusCode, 404, "POST Request must return code 404");
            assert.equal(err.data.errors[0].message, "Organisation 'unknown' Not Found");
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
            assert.equal(err.statusCode, 400, "POST Request must return code 400");
            assert.equal(is.string(err.data), true, "Returned data must be a string");
        }
    });

    japa("/addon/publish (Addon version must be semver)", async(assert) => {
        assert.plan(3);

        try {
            await post(new URL("/addon/publish", HTTP_URL), {
                body: {
                    name: "network",
                    description: "Network Addon",
                    version: "v0.1",
                    git: "https://github.com/SlimIO"
                },
                headers: {
                    authorization: accessToken
                }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 400, "POST Request must return code 400");
            assert.equal(is.string(err.data), true, "Returned data must be a string");
            assert.equal(err.data, "semver validation failed on version");
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
        assert.equal(is.array(data.versions), true);
        assert.equal(data.versions.length, 1);
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
            assert.equal(err.data.errors[0].message, "Addon 'network' already in use");
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
            assert.equal(err.data.errors[0].message, "Addon version must be greater than '0.1.0'");
        }
    });

    japa("/addon/publish (Publish - update version for network)", async(assert) => {
        {
            const { data, statusCode } = await post(new URL("/addon/publish", HTTP_URL), {
                body: {
                    name: "network",
                    description: "Network Addon",
                    version: "0.2.0",
                    git: "https://github.com/SlimIO"
                },
                headers: {
                    authorization: accessToken
                }
            });

            assert.equal(statusCode, 200, "POST Request must return code 200");
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
        assert.equal(is.array(data.versions), true);
        assert.equal(data.versions.length, 2);
    });

    japa("/:orgaName/:userName (Add 'fraxken' to SlimIO Org)", async(assert) => {
        const { data: ret } = await post(new URL("/login", HTTP_URL), {
            body: { username: "admin", password: "admin1953" }
        });
        adminToken = ret.access_token;

        const { data, statusCode } = await post(new URL("/organisation/SlimIO/fraxken", HTTP_URL), {
            headers: {
                authorization: adminToken
            }
        });

        assert.equal(statusCode, 201, "POST Request must return code 201");
        assert.equal(is.plainObject(data), true, "Returned data must be a plain Object");
        assert.deepEqual(Object.keys(data).sort(), ["createdAt", "updatedAt", "organisationId", "userId"].sort());
    });

    japa("/addon/publish (Publish addon on SlimIO Org)", async(assert) => {
        {
            const { data, statusCode } = await post(new URL("/addon/publish", HTTP_URL), {
                body: {
                    name: "evtlogs",
                    description: "Events logs Addon",
                    version: "1.0.0",
                    git: "https://github.com/SlimIO",
                    organisation: "SlimIO"
                },
                headers: {
                    authorization: accessToken
                }
            });

            assert.equal(statusCode, 201, "POST Request must return code 201");
            assert.equal(is.plainObject(data), true, "Returned data must be a plain Object");
            assert.deepEqual(Object.keys(data), ["addonId"]);
            assert.equal(is.number(data.addonId), true);
            assert.equal(data.addonId, 4);
        }

        const { data, statusCode } = await get(new URL("/addon/evtlogs", HTTP_URL));
        assert.equal(statusCode, 200, "POST Request must return code 200");
        assert.equal(is.plainObject(data), true, "Returned data must be a plain Object");

        assert.equal(data.name, "evtlogs");
        assert.equal(data.author.username, "fraxken");
        assert.equal(is.array(data.versions), true);
        assert.equal(data.versions.length, 1);
        assert.equal(is.plainObject(data.organisation), true);
        assert.equal(data.organisation.name, "SlimIO");
    });

    japa("/addon/publish (Publish addon on unknown Org)", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/addon/publish", HTTP_URL), {
                body: {
                    name: "evtlogs",
                    description: "Events logs Addon",
                    version: "1.0.0",
                    git: "https://github.com/SlimIO",
                    organisation: "unknown"
                },
                headers: {
                    authorization: accessToken
                }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 404, "POST Request must return code 404");
            assert.equal(err.data.errors[0].message, "Organisation 'unknown' not found");
        }
    });

    japa("/unknown/fraxken (Organisation Not Found)", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/organisation/unknown/fraxken", HTTP_URL), {
                headers: {
                    authorization: accessToken
                }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 404, "POST Request must return code 404");
            assert.equal(err.data.errors[0].message, "Organisation 'unknown' not found");
        }
    });

    japa("/SlimIO/fraxken (No right/permission on SlimIO Organisation)", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/organisation/SlimIO/fraxken", HTTP_URL), {
                headers: {
                    authorization: accessToken
                }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 401, "POST Request must return code 401");
            assert.equal(err.data.errors[0].message, "You have no right on 'SlimIO' organisation");
        }
    });

    japa("/SlimIO/boubou (User not found)", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/organisation/SlimIO/boubou", HTTP_URL), {
                headers: {
                    authorization: adminToken
                }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 404, "POST Request must return code 404");
            assert.equal(err.data.errors[0].message, "User 'boubou' not found");
        }
    });

    japa("/SlimIO/fraxken (User already in SlimIO Organisation)", async(assert) => {
        assert.plan(2);

        try {
            await post(new URL("/organisation/SlimIO/fraxken", HTTP_URL), {
                headers: {
                    authorization: adminToken
                }
            });
        }
        catch (err) {
            assert.equal(err.statusCode, 500, "POST Request must return code 500");
            assert.equal(err.data.errors[0].message, "User 'fraxken' already in the 'SlimIO' Organisation");
        }
    });

    japa("/organisation (Retrieve all organisations)", async(assert) => {
        const { data, statusCode } = await get(new URL("/organisation", HTTP_URL));
        assert.equal(statusCode, 200, "POST Request must return code 200");
        assert.equal(is.plainObject(data), true, "Returned data must be a plain Object");

        assert.deepEqual(Object.keys(data), ["SlimIO"]);
        assert.equal(is.array(data.SlimIO.users), true);
        assert.equal(is.array(data.SlimIO.addons), true);
        assert.equal(data.SlimIO.users.length, 1);
        assert.equal(data.SlimIO.addons.length, 2);
        assert.deepEqual(data.SlimIO.users, ["fraxken"]);
        assert.deepEqual(data.SlimIO.addons, ["evtlogs", "memory"]);
    });
});

