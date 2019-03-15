require("dotenv").config();
require("make-promises-safe");

// Require Third-party Dependencies
const polka = require("polka");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const send = require("@polka/send-type");
const argon2 = require("argon2");
const is = require("@slimio/is");

const userRouter = require("./routes/user.js");
const addonRouter = require("./routes/addon.js");
const organisationRouter = require("./routes/organisation.js");

const { SECRET_KEY } = require("./routes/utils.js");

// CONSTANTS
// const SECRET_KEY = process.env.registry_secret || "default_secret";

// Create POLKA Server
const server = polka();
server.use(bodyParser.json());
server.use("/users", userRouter);
server.use("/addon", addonRouter);
server.use("/organisation", organisationRouter);

// Uptime endpoint
server.get("/", async(req, res) => send(res, 200, { uptime: process.uptime() }));

// Login endpoint
server.post("/login", async(req, res) => {
    const { username, password } = req.body;

    // if (!is.string(username)) {
    //     return send(res, 500, { error: "username must be a typeof <string>" });
    // }
    // if (!is.string(password)) {
    //     return send(res, 500, { error: "password must be a typeof <string>" });
    // }

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
        id: user.id,
        username: user.username
    }, SECRET_KEY, { expiresIn: "3 hours" });

    return send(res, 200, { access_token });
});

module.exports = server;
