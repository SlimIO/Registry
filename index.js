require("make-promises-safe");

// Require Third-party Dependencies
const sqlite = require("sqlite");
const { yellow } = require("kleur");
require("dotenv").config();

// Require Internal Dependencies
const Sequelize = require("sequelize");
const server = require("./src/httpServer");
const models = require("./src/models");

// CONSTANTS
const PORT = process.env.PORT || 1337;

// set function in utils files ?!
async function initTables(tables, force = false) {
    for (const [, table] of Object.entries(tables)) {
        await table.sync({ force });
    }
}

/**
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main() {
    console.log(` > open SQLite database: ${yellow("./database.sqlite")}`);
    // sequelize = new Sequelize("database.db", "username", null, {
    //     storage: "database.db",
    //     dialect: "sqlite",
    //     logging: false
    // });
    sequelize = new Sequelize("test", "root", "root", { dialect: "mysql", logging: false });
    const tables = models(sequelize);

    // await initTables(tables);
    await sequelize.sync();

    server.use((req, res, next) => {
        Object.assign(req, tables);
        next();
    });

    server.listen(PORT, () => {
        console.log(`HTTP Server is listening (running) on port ${yellow(PORT)}`);
    });
}
main().catch(console.error);
