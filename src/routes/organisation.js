// Require Third-party Dependencies
const polka = require("polka");
const send = require("@polka/send-type");

// Require Internal Dependencies
const { isAuthenticated } = require("../utils.js");

// Create Router
const server = polka();

// all organisations endpoint
server.get("/", async(req, res) => {
    try {
        const organisations = await req.Organisation.findAll({
            attributes: ["name", "description"],
            include: [
                {
                    model: req.Users,
                    as: "owner",
                    attributes: ["username"]
                },
                {
                    model: req.Users,
                    attributes: ["username"],
                    through: { attributes: [] }
                },
                {
                    model: req.Addons,
                    attributes: ["name"]
                }
            ]
        });

        const cleanOrgs = organisations.reduce((curr, prev) => {
            curr[prev.name] = {
                description: prev.description,
                owner: prev.owner.username,
                users: prev.users.map((row) => row.username),
                addons: prev.addons.map((row) => row.name)
            };

            return curr;
        }, {});

        return send(res, 200, cleanOrgs);
    }
    catch (error) {
        /* istanbul ignore next */
        return send(res, 500, error);
    }
});

// get organisation by name endpoint
server.get("/:name", async(req, res) => {
    const name = req.params.name;

    try {
        const organisations = await req.Organisation.findAll({
            attributes: { exclude: ["id", "ownerId"] },
            where: { name },
            include: [
                {
                    model: req.Users,
                    as: "owner",
                    attributes: ["username"]
                },
                {
                    model: req.Users,
                    attributes: ["username"],
                    through: { attributes: [] }
                },
                {
                    model: req.Addons,
                    attributes: ["name"]
                }
            ]
        });

        if (organisations.length === 0) {
            return send(res, 500, `Organisation '${name}' Not Found`);
        }

        return send(res, 200, organisations[0]);
    }
    catch (error) {
        /* istanbul ignore next */
        return send(res, 500, error);
    }
});

// add user to an organisation
server.post("/:orgaName/:userName", isAuthenticated, async(req, res) => {
    const { orgaName, userName } = req.params;

    try {
        const organisation = await req.Organisation.findOne({ where: { name: orgaName } });
        if (organisation === null) {
            return send(res, 500, `Organisation '${orgaName}' not found`);
        }
        if (organisation.ownerId !== req.user.id) {
            return send(res, 401, "You have no right on this organisation");
        }

        const user = await req.Users.findOne({ where: { username: userName } });
        if (user === null) {
            return send(res, 500, `User ${userName} not found`);
        }

        if (await organisation.hasUsers(user)) {
            return send(res, 500, `User '${userName}' already in the '${orgaName}' Organisation`);
        }
        const result = await organisation.addUsers(user);

        return send(res, 201, { result });
    }
    catch (error) {
        /* istanbul ignore next */
        return send(res, 500, { error });
    }
});

// create an organisation
// server.post("/", isAuthenticated, async(req, res) => {
//     const { name, description } = req.body;
//     const ownerId = req.user.id;

//     try {
//         const orgaExist = await req.Organisation.findOne({ where: { name } });
//         if (orgaExist !== null) {
//             return send(res, 500, { error: `Organisation ${name} already exist` });
//         }

//         const organisation = await req.Organisation.create({
//             name, description, ownerId
//         });

//         const user = await req.Users.findOne({ where: { id: ownerId } });
//         const userIsInCurrentOrg = await organisation.hasUsers(user);
//         if (!userIsInCurrentOrg) {
//             await organisation.addUsers(user);
//         }

//         return send(res, 201, { organisationId: organisation.id });
//     }
//     catch (error) {
//         return send(res, 500, error);
//     }
// });

module.exports = server;
