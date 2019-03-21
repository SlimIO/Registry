require("make-promises-safe");
require("dotenv").config();

// Require Third-party Dependencies
const { yellow } = require("kleur");
const Sequelize = require("sequelize");

// Require Internal Dependencies
const server = require("./src/httpServer");
const models = require("./src/models");

// CONSTANTS
const PORT = process.env.PORT || 1337;

/**
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main() {
    console.log(` > open SQLite database: ${yellow("./database.sqlite")}`);
    const sequelize = new Sequelize("test", "root", "root", { dialect: "mysql", logging: false });
    const tables = models(sequelize);

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
