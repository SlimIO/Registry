// Require Third-party Dependencies
const polka = require("polka");
const send = require("@polka/send-type");
const is = require("@slimio/is");
const semver = require("semver");
const semverSort = require("semver-sort");

// Require Internal Dependencies
const { isAuthenticated } = require("./utils.js");

const server = polka();

// Addons endpoint
server.get("/", async(req, res) => {
    try {
        const addons = await req.Addons.findAll({
            attributes: { exclude: ["id", "authorId", "organisationId"] },
            include: [{
                model: req.Users,
                as: "author",
                attributes: ["username"]
            },
            {
                model: req.Version,
                attributes: { exclude: ["id", "addonId"] }
            },
            {
                model: req.Organisation,
                attributes: { exclude: ["id", "ownerId"] }
            }]
        });

        return send(res, 200, addons);
    }
    catch (error) {
        return send(res, 500, error);
    }
});

// Addon Name endpoint
server.get("/:addonName", async(req, res) => {
    const addonName = req.params.addonName;

    try {
        const addons = await req.Addons.findAll({
            where: { name: addonName },
            attributes: { exclude: ["id", "authorId", "organisationId"] },
            include: [{
                model: req.Users,
                as: "author",
                attributes: ["username"]
            },
            {
                model: req.Version,
                attributes: { exclude: ["id", "addonId"] }
            },
            {
                model: req.Organisation,
                attributes: { exclude: ["id", "ownerId"] }
            }]
        });

        if (addons.length === 0) {
            return send(res, 204, { error: "Addon not found!" });
        }

        return send(res, 200, addons[0]);
    }
    catch (error) {
        return send(res, 500, error);
    }
});


// publish addon endpoint
server.post("/", isAuthenticated, async(req, res) => {
    const { name, description, version, git, organisation } = req.body;
    const authorId = req.user.id;

    try {
        let organisationId;
        if (!is.nullOrUndefined(organisation)) {
            const organisationExist = await req.Organisation.findOne({
                where: { name: organisation }
            });

            if (is.nullOrUndefined(organisationExist)) {
                return send(res, 204, { error: "Organisation not found" });
            }
            organisationId = organisationExist.id;
        }

        const addonExist = await req.Addons.findOne({
            where: { name },
            include: [{
                model: req.Version,
                attributes: { exclude: ["id", "addonId"] }
            }]
        });

        if (addonExist === null) {
            const addon = await req.Addons.create({
                name, description, authorId, versions: [{ version }], git, organisationId
            }, { include: [req.Version] });

            return send(res, 200, { addonID: addon.id });
        }

        if (authorId !== addonExist.authorId) {
            return send(res, 500, { error: "Addon name already exist" });
        }

        const versions = addonExist.versions.map((obj) => obj.version);
        // const isNewVersion = versions.every((ver) => ver !== version);

        semverSort.desc(versions);
        const greatestVersion = versions.shift();
        if (!is.nullOrUndefined(greatestVersion) && semver.gt(version, greatestVersion) === false) {
            return send(res, 500, { error: `Addon version must be greater than ${greatestVersion}` });
        }

        await addonExist.addVersion(await req.Version.create({ version }));

        return send(res, 201, { addonID: addonExist.id });
    }
    catch (error) {
        console.log(error);

        return send(res, 500, { error });
    }
});

module.exports = server;
