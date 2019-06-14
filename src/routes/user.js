// Require Third-party Dependencies
const polka = require("polka");
const send = require("@polka/send-type");
const is = require("@slimio/is");
const argon2 = require("argon2");
const { validate } = require("indicative");
const sequelize = require("sequelize");
const uuid = require("uuid/v4");

// Require Internal Dependencies
const rules = require("../validationRules");

// Globals
const Op = sequelize.Op;

// Create router
const server = polka();

// create user endpoint
server.post("/", async(req, res) => {
    try {
        await validate(req.body, rules.userRegistration);
    }
    catch (err) {
        return send(res, 500, err.map((row) => row.message));
    }
    const { username, password, email } = req.body;

    const exist = await req.Users.findOne({ where: {
        [Op.or]: [{ username }, { email }]
    } });
    if (!is.nullOrUndefined(exist)) {
        return send(res, 500, "Sorry! Seem you have already registered an account with this email/username.");
    }

    // TODO: Send email to activate account
    const token = uuid();

    const user = await req.Users.create({
        username, email, password: await argon2.hash(password)
    });

    const userId = user.id;
    await req.Tokens.create({ token, userId });

    return send(res, 201, { userId });
});

// all users endpoint
// server.get("/", async(req, res) => {
//     const users = await req.Users.findAll({
//         attributes: { exclude: ["password", "id"] },
//         include: [{
//             model: req.Addons,
//             attributes: ["name", "description"],
//             include: {
//                 model: req.Organisation,
//                 attributes: ["name"]
//             }
//         },
//         {
//             model: req.Organisation,
//             attributes: ["name", "description"],
//             through: { attributes: [] }
//         }]
//     });

//     return send(res, 200, users);
// });

// user Name endpoint
// server.get("/:userName", async(req, res) => {
//     const userName = req.params.userName;

//     const user = await req.Users.findOne({
//         where: { userName },
//         attributes: { exclude: ["password", "id"] },
//         include: [
//             {
//                 model: req.Addons,
//                 attributes: ["name", "description"],
//                 include: {
//                     model: req.Organisation,
//                     attributes: ["name"]
//                 }
//             },
//             {
//                 model: req.Organisation,
//                 attributes: ["name", "description"],
//                 through: { attributes: [] }
//             }
//         ]
//     });

//     if (is.nullOrUndefined(user)) {
//         return send(res, 500, { error: "User not found!" });
//     }

//     return send(res, 200, user);
// });

module.exports = server;
