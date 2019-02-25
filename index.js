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

async function initTables(tables, force = false) {
    const initTable = [];
    for (const [, table] of Object.entries(tables)) {
        initTable.push(table.sync({ force }));
    }
    await Promise.all(initTable);
}

/**
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main() {
    console.log(` > open SQLite database: ${yellow("./database.sqlite")}`);
    const sequelize = new Sequelize("./database.sqlite");
    const tables = models(sequelize);

    await initTables(tables);

    server.use((req, res, next) => {
        Object.assign(req, tables);
        next();
    });

    server.listen(PORT, () => {
        console.log(`HTTP Server is listening (running) on port ${yellow(PORT)}`);
    });
}
main().catch(console.error);
