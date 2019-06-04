require("make-promises-safe");
require("dotenv").config();

// Require Node.js Dependencies
const { join } = require("path");

// Require Third-party Dependencies
const { yellow, white } = require("kleur");
const Sequelize = require("sequelize");

// Require Internal Dependencies
const server = require("./src/httpServer");
const models = require("./src/models");

// CONSTANTS
const PORT = process.env.PORT || 1338;
const DB_OPTIONS = {
    dialect: process.env.DB_DIALECT || "sqlite",
    database: process.env.DB_NAME || "registry",
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || null,
    logging: false
};

if (process.env.DB_DIALECT === "sqlite") {
    DB_OPTIONS.storage = join(__dirname, "database.sqlite");
}

/**
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main() {
    console.log(white().bold(` > init SQLite database: ${yellow().bold(join(__dirname, "database.sqlite"))}`));
    const sequelize = new Sequelize(DB_OPTIONS);
    const tables = models(sequelize);

    await sequelize.sync();

    server.use((req, res, next) => {
        Object.assign(req, tables);
        next();
    });

    server.listen(PORT, () => {
        console.log(white().bold(`HTTP Server is listening on port ${yellow().bold(PORT)}`));
    });
}
main().catch(console.error);
