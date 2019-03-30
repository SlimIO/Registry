// Require Node.js Dependencies
const { unlink } = require("fs").promises;
const { join } = require("path");

// Require Third-party Dependencies
const is = require("@slimio/is");
const argon2 = require("argon2");
const japa = require("japa");
const Sequelize = require("sequelize");

// Require Internal Dependencies
const models = require("../src/models");
const httpServer = require("../src/httpServer");

// CONSTANTS
const HTTP_PORT = 2777;
const DB_PATH = join(__dirname, "db_test.db");

// Globals
let user;
let sequelize;

japa.group("test", (group) => {
    group.before(async() => {
        sequelize = new Sequelize(DB_PATH, "username", null, {
            storage: DB_PATH,
            dialect: "sqlite",
            logging: false
        });
        sequelize.close();

        const tables = models(sequelize);
        await sequelize.sync({ force: true });

        // Hydrate DB
        user = await tables.Users.create({
            username: "admin",
            password: await argon2.hash("admin")
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
    });

    group.after(async() => {
        await sequelize.close();
        await unlink(DB_PATH);
    });

    japa("title", (assert) => {
        assert.equal(1, 1);
    });
});

