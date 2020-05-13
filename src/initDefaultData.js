"use strict";

// Require Third-party Dependencies
const argon2 = require("argon2");

/**
 * @function initDefaultData
 * @param {*} tables Sequelize tables
 * @returns {void}
 */
async function initDefaultData(tables) {
    console.log("INIT DEFAULT DATA!");
    const [user] = await tables.Users.findOrCreate({
        where: {
            username: "fraxken"
        },
        defaults: {
            username: "fraxken",
            active: true,
            email: "gentilhomme.thomas@gmail.com",
            password: await argon2.hash(process.env.ADMIN_PASSWORD || "admin")
        }
    });

    const [org] = await tables.Organisation.findOrCreate({
        where: {
            name: "SlimIO"
        },
        defaults: {
            name: "SlimIO",
            description: "SlimIO Official Organisation",
            ownerId: user.id
        }
    });

    await tables.Addons.findOrCreate({
        where: {
            name: "cpu"
        },
        defaults: {
            name: "cpu",
            description: "CPU Addon",
            latest: "1.0.0",
            version: {
                version: "1.0.0",
                git: "https://github.com/SlimIO/cpu-addon"
            },
            authorId: user.id,
            organisationId: org.id
        }
    });
}

module.exports = initDefaultData;
