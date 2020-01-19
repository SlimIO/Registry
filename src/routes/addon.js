"use strict";

// Require Third-party Dependencies
const polka = require("polka");
const send = require("@polka/send-type");
const is = require("@slimio/is");
const semver = require("semver");
const semverSort = require("semver-sort");

// Require Internal Dependencies
const { isAuthenticated, validationMiddleware } = require("../utils.js");
const rules = require("../validationRules");

// Create Router
const server = polka();

server.get("/", async(req, res) => {
    try {
        const addons = await req.Addons.findAll({ attributes: ["name"] });

        return send(res, 200, addons.map((row) => row.name));
    }
    catch (error) {
        /* istanbul ignore next */
        return send(res, 500, error);
    }
});

server.get("/:addonName", validationMiddleware(rules.addon, { params: true }), async(req, res) => {
    try {
        const addonName = req.params.addonName;
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

        return addons.length === 0 ?
            send(res, 500, `Unable to found Addon '${addonName}'`) :
            send(res, 200, addons[0]);
    }
    catch (error) {
        /* istanbul ignore next */
        return send(res, 500, error);
    }
});

server.post("/publish", isAuthenticated, validationMiddleware(rules.publish), async(req, res) => {
    const { name, description, version, git, organisation } = req.body;
    const authorId = req.user.id;

    try {
        let organisationId;
        if (!is.nullOrUndefined(organisation)) {
            const organisationExist = await req.Organisation.findOne({
                where: { name: organisation }
            });

            if (is.nullOrUndefined(organisationExist)) {
                return send(res, 500, `Organisation '${organisation}' not found`);
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
            const versions = [{ version, git }];
            const addon = await req.Addons.create({
                name, description, authorId, latest: version, versions, organisationId
            }, { include: [req.Version] });

            return send(res, 201, { addonId: addon.id });
        }

        if (authorId !== addonExist.authorId) {
            return send(res, 500, `Addon '${name}' already in use`);
        }

        const versions = addonExist.versions.map((obj) => obj.version);
        semverSort.desc(versions);
        const greatestVersion = versions.shift();

        if (!is.nullOrUndefined(greatestVersion) && semver.gt(version, greatestVersion) === false) {
            return send(res, 500, `Addon version must be greater than '${greatestVersion}'`);
        }
        await addonExist.addVersion(await req.Version.create({ version, git }));
        await addonExist.update({ latest: version });

        return send(res, 200, { addonId: addonExist.id });
    }
    catch (error) {
        /* istanbul ignore next */
        return send(res, 500, { error });
    }
});

module.exports = server;
