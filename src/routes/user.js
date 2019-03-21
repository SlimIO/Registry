// Require Third-party Dependencies
const polka = require("polka");
const send = require("@polka/send-type");
const is = require("@slimio/is");
const argon2 = require("argon2");

// Create router
const server = polka();

// all users endpoint
server.get("/", async(req, res) => {
    const users = await req.Users.findAll({
        attributes: { exclude: ["password", "id"] },
        include: [{
            model: req.Addons,
            attributes: ["name", "description"],
            include: {
                model: req.Organisation,
                attributes: ["name"]
            }
        },
        {
            model: req.Organisation,
            attributes: ["name", "description"],
            through: { attributes: [] }
        }]
    });

    return send(res, 200, users);
});

// create user endpoint
server.post("/", async(req, res) => {
    const { username, password } = req.body;

    if (!is.string(password)) {
        return send(res, 500, { error: "password must be a typeof <string>" });
    }

    const exist = await req.Users.findOne({
        where: { username }
    });

    if (!is.nullOrUndefined(exist)) {
        return send(res, 500, { error: "This username already exist" });
    }

    const cryptPw = await argon2.hash(password);

    const user = await req.Users.create({
        username,
        password: cryptPw
    });

    return send(res, 200, { userId: user.id });
});

// user Name endpoint
server.get("/:userName", async(req, res) => {
    const userName = req.params.userName;

    const user = await req.Users.findOne({
        where: { userName },
        attributes: { exclude: ["password", "id"] },
        include: [
            {
                model: req.Addons,
                attributes: ["name", "description"],
                include: {
                    model: req.Organisation,
                    attributes: ["name"]
                }
            },
            {
                model: req.Organisation,
                attributes: ["name", "description"],
                through: { attributes: [] }
            }
        ]
    });

    if (is.nullOrUndefined(user)) {
        return send(res, 500, { error: "User not found!" });
    }

    return send(res, 200, user);
});

module.exports = server;
