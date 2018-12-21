require("make-promises-safe");

// Require Third-party Dependencies
const sqlite = require("sqlite");
const { yellow } = require("kleur");
require("dotenv").config();

// Require Internal Dependencies
const server = require("./src/httpServer");

// CONSTANTS
const PORT = process.env.PORT || 1337;

async function main() {
    console.log(` > open SQLite database: ${yellow("./database.sqlite")}`);
    const db = await sqlite.open("./database.sqlite");

    server.use((req, res, next) => {
        req.db = db;
        next();
    });

    server.listen(PORT, () => {
        console.log(`HTTP Server is listening (running) on port ${yellow(PORT)}`);
    });
}
main().catch(console.error);
