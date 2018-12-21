// Require Node.js Dependencies
const { readFile } = require("fs").promises;
const { join } = require("path");

// Require Third-party Dependencies
const sqlite = require("sqlite");

/**
 * @async
 * @function readData
 * @returns {Promise<void>}
 */
async function readData() {
    const db = await sqlite.open("../database.sqlite");
    const sql = await readFile(join(__dirname, "registry.sql"), { encoding: "utf8" });

    await db.exec(sql);
}
readData().catch(console.error);
