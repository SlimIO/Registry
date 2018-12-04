// Require NodeJS Dependencies
const polka = require("polka");
const sqlite = require("sqlite");
const { readFile } = require("fs").promises;

/**
 * @async
 * @function serverPolka
 * @returns {void}
*/
async function serverPolka() {
    // Create Local Database Constante
    const db = await sqlite.open("./database.sqlite");

    // Create HTTP Server
    const server = polka();

    // Global middleware
    server.use((req, res, next) => {
        res.json = function json(payload) {
            return res.end(JSON.stringify(payload));
        };

        next();
    });

    // Uptime endpoint
    server.get("/", async(req, res) => {
        res.json({
            uptime: process.uptime()
        });
    });

    // Addons endpoint
    server.get("/addons", async(req, res) => {
        const addons = await db.all("SELECT DISTINCT name FROM addons");

        res.json(addons.map((row) => row.name));
    });

    // Addon Name endpoint
    server.get("/addons/:addonName", async(req, res) => {
        const addonName = req.params.addonName;

        const addon = await db.get("SELECT DISTINCT name, description FROM addons WHERE name=?", addonName.slice(0));
        if (typeof addon === "undefined") {
            return res.json({ error: "Addon not found!" });
        }

        return res.json(addon);
    });

    // Boot Http Server
    server.listen(1337, () => {
        console.log("HTTP Server started on port 1337");
    });
}
serverPolka().catch(console.error);
// catch errors
