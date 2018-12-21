// Require Third-party Dependencies
const polka = require("polka");
const sqlite = require("sqlite");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const send = require("@polka/send-type");
const argon2 = require("argon2");
const env = require("dotenv").config();

// CONSTANTS
const PORT = env.parsed.PORT;
const SECRET_KEY = env.parsed.registry_secret;
const adminPassword = env.parsed.admin_password;

/**
 * @async
 * @function serverPolka
 * @returns {Promise<void>}
 */
async function serverPolka() {
    // Create Local Database Constante
    const db = await sqlite.open("./database.sqlite");

    // Create POLKA Server
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

    // Addons POST
    server.post("/addons", async(req, res) => {
        console.log(req);
        jwt.verify(req.headers.authorization.split(" ")[1], SECRET_KEY, (err, authData) => {
            if (err) {
                send(res, 402, "Bad token");
            }
            else {
                send(res, 200, "yo");
            }
        });
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
        // Verifying password
        const verifyCryptedPassword = await argon2.verify(req.body.password, adminPassword);

        // Testing if user exist
        if (!req.body.username || verifyCryptedPassword === false) {
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

        const userIsAdmin = await db.get(
            "SELECT DISTINCT user_id, orga_id FROM slimio_user WHERE user_id=? AND orga_id=?",
            user.id,
            1
        );
        if (userIsAdmin === "undefined") {
            return send(res, 401, "Access denied");
        }

        const token = jwt.sign({
            sub: user.id,
            username: user.username

        }, SECRET_KEY, { expiresIn: "3 hours" });

        return send(res, 200, { access_token: token });
    });

    // slimio post addon
    server.post("/slimio/addon", async(req, res) => {
        jwt.verify(req.headers.authorization.split(" ")[1], SECRET_KEY, (err, authData) => {
            if (err) {
                send(res, 402, "Bad token");
            }
            else {
                if (req.body.addonName === undefined) {
                    send(res, 403, "Votre addon n'a pas de nom");
                }
                else if (req.body.description === undefined) {
                    send(res, 403, "Votre addon n'a pas de description");
                }
                else if (req.body.version === undefined) {
                    send(res, 403, "Votre addon n'a pas de version");
                }
                else if (req.body.author === undefined) {
                    send(res, 403, "Votre addon n'a pas d'auteur'");
                }
                else if (req.body.git === undefined) {
                    send(res, 403, "Votre addon n'a pas de lien git");
                }
                send(res, 200, `bonjour ${req.headers.name}`);
            }
        });
        await db.exec(`INSERT INTO "addons"
        ("name", "description", "version", "author", "git")
    VALUES
        ("${req.body.addonName}", "${req.body.description}", "${req.body.version}", "${req.body.author}", "${req.body.git}")`);
    });
}
serverPolka().catch(console.error);
