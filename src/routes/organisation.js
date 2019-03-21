// Require Third-party Dependencies
const polka = require("polka");
const send = require("@polka/send-type");

// Require Internal Dependencies
const { isAuthenticated } = require("../utils.js");

// Create Router
const server = polka();

// all oraganisations endpoint
server.get("/", async(req, res) => {
    try {
        const organisations = await req.Organisation.findAll({
            attributes: { exclude: ["id", "ownerId"] },
            include: [{
                model: req.Users,
                as: "owner",
                attributes: { exclude: ["id", "password"] }
            },
            {
                model: req.Users,
                attributes: { exclude: ["id", "password"] },
                through: { attributes: [] }
            },
            {
                model: req.Addons,
                attributes: { exclude: ["id", "authorId", "organisationId"] }
            }]
        });

        return send(res, 200, organisations);
    }
    catch (error) {
        return send(res, 500, error);
    }
});

// get oraganisations by name endpoint
server.get("/:name", async(req, res) => {
    const name = req.params.name;

    try {
        const organisations = await req.Organisation.findAll({
            attributes: { exclude: ["id", "ownerId"] },
            where: { name },
            include: [{
                model: req.Users,
                as: "owner",
                attributes: { exclude: ["id", "password"] }
            },
            {
                model: req.Users,
                attributes: { exclude: ["id", "password"] },
                through: { attributes: [] }
            },
            {
                model: req.Addons,
                attributes: { exclude: ["id", "authorId", "organisationId"] }
            }]
        });

        if (organisations.length === 0) {
            return send(res, 204, { error: "Organisation not found!" });
        }

        return send(res, 200, organisations[0]);
    }
    catch (error) {
        return send(res, 500, error);
    }
});

// create an oraganisation
server.post("/", isAuthenticated, async(req, res) => {
    const { name, description } = req.body;
    const ownerId = req.user.id;

    try {
        const orgaExist = await req.Organisation.findOne({ where: { name } });
        if (orgaExist !== null) {
            return send(res, 500, { error: `Organisation ${name} already exist` });
        }

        const organisation = await req.Organisation.create({
            name, description, ownerId
        });

        const user = await req.Users.findOne({ where: { id: ownerId } });
        const userIsInCurrentOrg = await organisation.hasUsers(user);
        if (!userIsInCurrentOrg) {
            await organisation.addUsers(user);
        }

        return send(res, 201, { organisationId: organisation.id });
    }
    catch (error) {
        return send(res, 500, error);
    }
});

// add user to an oraganisation
server.post("/:orgaName/:userName", isAuthenticated, async(req, res) => {
    const { orgaName, userName } = req.params;

    try {
        const organisation = await req.Organisation.findOne({ where: { name: orgaName } });
        if (organisation === null) {
            return send(res, 204, { error: `Organisation ${orgaName} not found` });
        }
        if (organisation.ownerId !== req.user.id) {
            return send(res, 500, { error: "You have no right on this organisation" });
        }

        const user = await req.Users.findOne({ where: { username: userName } });
        if (user === null) {
            return send(res, 204, { error: `User ${userName} not found` });
        }

        if (await organisation.hasUsers(user)) {
            return send(res, 500, { error: `User ${userName} is already in the Organisation` });
        }

        return send(res, 200, {
            result: await organisation.addUsers(user)
        });
    }
    catch (error) {
        return send(res, 500, { error });
    }
});

// for V2 ?
// delete oraganisation by name
// server.delete("/:orgaName", isAuthenticated, async(req, res) => {
//     const orgaName = req.params.orgaName;

//     let result;
//     try {
//         const organisation = await req.Organisation.findOne({ where: { name: orgaName } });
//         if (organisation === null) {
//             return send(res, 500, { error: `Organisation ${orgaName} not found` });
//         }
//         if (organisation.ownerId !== req.user.id) {
//             return send(res, 500, { error: "You have no right on this organisation" });
//         }

//         result = await req.Organisation.destroy({
//             where: { name: orgaName }
//         });
//     }
//     catch (error) {
//         return send(res, 500, error);
//     }

//     return send(res, 200, { result });
// });

module.exports = server;
