// Require NodeJS Dependencies
const sqlite = require("sqlite");
const { readFile } = require("fs").promises;

/**
 * @async
 * @function readData
 * @returns {Promise<void>}
 *  */
async function readData() {
    const db = await sqlite.open("../database.sqlite");
    const sql = await readFile("../registry.sql", { encoding: "utf8" });
    await db.exec(sql);
} readData().catch(console.error);
