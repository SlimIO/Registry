// Require Third-party Dependencies
const polka = require("polka");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const send = require("@polka/send-type");
const argon2 = require("argon2");
const { validate } = require("indicative");

// Require Internal Dependencies
const { user, addon, organisation } = require("./routes");
const rules = require("./validationRules");
const utils = require("./utils");

// Create POLKA Server
const server = polka();
server.use(bodyParser.json());
server.use("/users", user);
server.use("/addon", addon);
server.use("/organisation", organisation);

// Uptime endpoint
server.get("/", (req, res) => send(res, 200, { uptime: process.uptime() }));

// Login endpoint
server.post("/login", async(req, res) => {
    try {
        await validate(req.body, rules.user);
    }
    catch (err) {
        return send(res, 500, err.map((row) => row.message));
    }
    const { username, password } = req.body;

    const user = await req.Users.findOne({
        attributes: ["username", "password", "id"],
        where: { username }
    });
    if (user === null) {
        return send(res, 500, "User not found");
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
    }, utils.SECRET_KEY, { expiresIn: "3 hours" });

    return send(res, 200, { access_token });
});

module.exports = server;
