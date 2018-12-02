const polka = require("polka");
const sqlite = require("sqlite");
const { readFile } = require("fs").promises;

async function main() {
    console.log("Connect SQLite database");
    const db = await sqlite.open("./database.sqlite");

    const sql = await readFile("./mytable.sql", { encoding: "utf8" });
    await db.exec(sql);

    console.log("done");

    // Create HTTP Server
    const server = polka();

    server.use((req, res, next) => {
        res.json = function json(payload) {
            return res.end(JSON.stringify(payload));
        }

        next();
    });

    server.get("/", async (req, res) => {
        res.json({
            uptime: process.uptime()
        });
    });

    server.get("/addons", async (req, res) => {
        const addons = await db.all("SELECT DISTINCT name FROM addons");

        res.json(addons.map((row) => row.name));
    });

    server.get("/addons/:addonName", async (req, res) => {
        const addonName = req.params.addonName;

        const addon = await db.get(`SELECT DISTINCT name, description FROM addons WHERE name=?`, addonName.slice(0));
        if (typeof addon === "undefined") {
            return res.json({ error: "Addon not found!" });
        }

        return res.json(addon);
    });

    server.listen(1337, () => {
        console.log("HTTP Server started on port 1337");
    });
}
main().catch(console.error);
