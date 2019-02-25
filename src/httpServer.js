require("dotenv").config();
require("make-promises-safe");

// Require Third-party Dependencies
const polka = require("polka");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const send = require("@polka/send-type");
const argon2 = require("argon2");

// CONSTANTS
const SECRET_KEY = process.env.registry_secret || "default_secret";

function isAuthenticated(req, res, next) {
    jwt.verify(req.headers.authorization, SECRET_KEY, (err) => {
        if (err) {
            return send(res, 402, "Invalid Token");
        }

        return next();
    });
}

// Create POLKA Server
const server = polka();
server.use(bodyParser.json());

// Uptime endpoint
server.get("/", async(req, res) => {
    send(res, 200, { uptime: process.uptime() });
});

// Addons endpoint
server.get("/addons", async(req, res) => {
    const addons = await req.Addons.findAll();

    send(res, 200, addons.map((row) => row.name));
});

// Addon Name endpoint
server.get("/addons/:addonName", async(req, res) => {
    const addonName = req.params.addonName;

    const addon = await req.Addons.findOne({
        attributes: ["name", "description"], where: { name: addonName }
    });

    if (addon === null) {
        return send(res, 500, { error: "Addon not found!" });
    }

    return send(res, 200, addon);
});

// Login endpoint
server.post("/login", async(req, res) => {
    const { username, password } = req.body;
    const user = await req.Users.findOne({
        attributes: ["username", "password", "id"],
        where: { username }
    });
    if (user === null) {
        return send(res, 401, "User not found");
    }

    // Verifying password
    const isMatching = await argon2.verify(user.password, password);
    if (!isMatching) {
        return send(res, 401, "Invalid User Password");
    }

    // eslint-disable-next-line
    const access_token = jwt.sign({
        sub: user.id,
        username: user.username
    }, SECRET_KEY, { expiresIn: "3 hours" });

    return send(res, 200, { access_token });
});

// slimio post addon
server.post("/publishAddon", isAuthenticated, async(req, res) => {
    const { name, description, version, author, git } = req.body;
    let result;
    try {
        result = await req.Addons.create({ name, description, version, author, git });
    }
    catch (error) {
        return send(res, 500, error);
    }

    return send(res, 200, { addonID: result.id });
});

module.exports = server;
