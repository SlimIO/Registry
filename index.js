// Require NodeJS Dependencies
const polka = require("polka");
const sqlite = require("sqlite");
const { readFile } = require("fs").promises;
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const send = require("@polka/send-type");

// CONSTANTS
const PORT = process.env.PORT || 1337;
const SECRET_KEY = process.env.registry_secret;

/**
 * @async
 * @function serverPolka
 * @returns {void}
*/
async function serverPolka() {
    // Create Local Database Constante
    const db = await sqlite.open("./database.sqlite");

    // Create HTTP Server
    const server = polka().listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    // Global middleware
    server.use(bodyParser.json());
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

    // Login endpoint
    server.post("/login", async(req, res) => {
        if (!req.body.username || !req.body.password) {
            return send(res, 400, "You need a login and a password");
        }

        const user = await db.get(
            "SELECT DISTINCT username, password, id FROM users WHERE username=? AND password=?",
            req.body.username,
            req.body.password
        );

        if (typeof user === "undefined") {
            return send(res, 401, "User not found");
        }

        const token = jwt.sign({
            sub: user.id,
            username: user.username

        }, SECRET_KEY, { expiresIn: "1 min" });

        return send(res, 200, { access_token: token });
    });

    // protected ressource endpoint
    server.get("/protected", (req, res) => {
        jwt.verify(req.headers.authorization.split(" ")[1], SECRET_KEY, (err, authData) => {
            if (err) {
                send(res, 402, "Bad token");
            }
            else {
                send(res, 200, "yo");
            }
        });
    });
}
serverPolka().catch(console.error);
