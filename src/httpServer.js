// Require Third-party Dependencies
const polka = require("polka");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const send = require("@polka/send-type");
const argon2 = require("argon2");
const indicative = require("indicative");
require("dotenv").config();

// CONSTANTS
const SECRET_KEY = process.env.registry_secret || "default_secret";

function isAuthenticated(req, res, next) {
    jwt.verify(req.headers.authorization.split(" ")[1], SECRET_KEY, (err) => {
        if (err) {
            return send(res, 402, "Invalid Token");
        }

        return next();
    });
}

// Create POLKA Server
const server = polka();

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
    const addons = await req.db.all("SELECT DISTINCT name FROM addons");

    res.json(addons.map((row) => row.name));
});

// Addon Name endpoint
server.get("/addons/:addonName", async(req, res) => {
    const addonName = req.params.addonName;

    const addon = await req.db.get("SELECT DISTINCT name, description FROM addons WHERE name=?", addonName.slice(0));
    if (typeof addon === "undefined") {
        return res.json({ error: "Addon not found!" });
    }

    return res.json(addon);
});

// Login endpoint
server.post("/login", async(req, res) => {
    const { username, password } = req.body;
    if (!username) {
        return send(res, 400, "You need a login and a password");
    }

    const user = await req.db.get(
        "SELECT DISTINCT username, password, id FROM users WHERE username=? AND password=?",
        username,
        password
    );
    if (typeof user === "undefined") {
        return send(res, 401, "User not found");
    }

    // Verifying password
    const isMatching = await argon2.verify(password, user.password);
    if (!isMatching) {
        return send(res, 401, "Invalid User Password");
    }

    const token = jwt.sign({
        sub: user.id,
        username: user.username
    }, SECRET_KEY, { expiresIn: "3 hours" });

    return send(res, 200, { access_token: token });
});

const AddonRules = {
    name: "required|string|min:2",
    description: "required|string",
    version: "required|string",
    author: "required|string",
    git: "required|string"
};

// slimio post addon
server.post("/publishAddon", isAuthenticated, async(req, res) => {
    await indicative.validateAll(req.body, AddonRules);
    const { name, description, version, author, git } = req.body;

    const { lastID } = await req.db.run("INSERT INTO addons (name, description, version, author, git) VALUES (?, ?, ?, ?, ?)",
        name, description, version, author, git);

    return { addonID: lastID };
});

module.exports = server;
