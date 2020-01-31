"use strict";

// Require Third-party Dependencies
const polka = require("polka");
const send = require("@polka/send-type");
const is = require("@slimio/is");
const argon2 = require("argon2");
const sequelize = require("sequelize");
const uuid = require("uuid/v4");
const nodemailer = require("nodemailer");

// Require Internal Dependencies
const { validationMiddleware, INTERNAL_ERROR, createHTTPError, CODES } = require("../utils");
const rules = require("../validationRules");

// VARS
const Op = sequelize.Op;

// Create router
const server = polka();

/**
 * @async
 * @function createTransporter
 * @returns {Promise<Mail>}
 */
async function createTransporter() {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    const { user, pass } = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user, pass }
    });
}

server.post("/", validationMiddleware(rules.userRegistration), async(req, res) => {
    try {
        const { username, password, email } = req.body;

        const exist = await req.Users.findOne({ where: {
            [Op.or]: [{ username }, { email }]
        } });
        if (!is.nullOrUndefined(exist)) {
            return send(res, 500, createHTTPError({
                code: CODES.EEXIST, message: "An account is already registered with this given email or username."
            }));
        }

        const token = uuid();
        const transporter = await createTransporter();
        const info = await transporter.sendMail({
            from: "\"SlimIO Team\" <gentilhommme.thomas@gmail.com>",
            to: email,
            subject: "SlimIO Registry Account Registration",
            text: `Register your account with the following token: ${token}`
        });
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        const user = await req.Users.create({
            username, email, password: await argon2.hash(password)
        });

        const userId = user.id;
        await req.Tokens.create({ token, userId });

        return send(res, 201, {});
    }
    catch (err) {
        return send(res, 500, INTERNAL_ERROR);
    }
});

server.post("/activeAccount", async(req, res) => {
    const { token } = req.body;
    if (typeof token !== "string") {
        return send(res, 400, createHTTPError("token must be a string"));
    }

    try {
        const row = await req.Tokens.findOne({ where: { token } });
        if (row === null) {
            return send(res, 500, createHTTPError("unable to activate account"));
        }

        const [count] = await req.Users.update({ active: true }, { where: { id: row.userId } });
        if (count !== 1) {
            return send(res, 500, createHTTPError("unable to activate account"));
        }

        await req.Tokens.destroy({ where: { id: row.id } });

        return send(res, 200, {});
    }
    catch (err) {
        return send(res, 500, INTERNAL_ERROR);
    }
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
