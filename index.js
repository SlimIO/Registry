"use strict";

require("make-promises-safe");
require("dotenv").config();

// Require Node.js Dependencies
const { join } = require("path");

// Require Third-party Dependencies
const { yellow, white } = require("kleur");
const Sequelize = require("sequelize");
const rateLimiter = require("express-rate-limit");

// Require Internal Dependencies
const server = require("./src/httpServer");
const models = require("./src/models");

// CONSTANTS
const PORT = process.env.PORT || 1338;
const DB_OPTIONS = {
    host: process.env.DB_HOST || "localhost",
    dialect: process.env.DB_DIALECT || "sqlite",
    database: process.env.DB_NAME || "registry",
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || null,
    logging: false
};
const CLEAN_INTERVAL_MS = 24 * 60 * 60000;

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
    let isClosed = false;

    await sequelize.sync();

    // Cleanup Interval
    setInterval(async() => {
        const now = new Date().getTime();

        try {
            const deletedCount = await tables.Users.delete({
                where: {
                    active: false,
                    createdAt: {
                        [Sequelize.Op.lt]: now - CLEAN_INTERVAL_MS
                    }
                }
            });
            console.log(deletedCount);
        }
        catch (err) {
            console.error(err);
        }
    }, CLEAN_INTERVAL_MS);

    server.use(rateLimiter({
        windowMs: 60 * 1000,
        max: 100
    }));
    server.use((req, res, next) => {
        Object.assign(req, tables);
        next();
    });

    server.listen(PORT, () => {
        console.log(white().bold(`HTTP Server is listening on port ${yellow().bold(PORT)}`));
    });

    /**
     * @async
     * @function close
     * @returns {Promise<void>}
     */
    async function close() {
        if (isClosed) {
            return;
        }
        isClosed = true;
        console.log(white().bold("Exiting HTTP Server!"));
        await sequelize.close();
        server.server.close();
    }

    process.once("exit", close);
    process.once("SIGINT", close);
}
main().catch(console.error);
