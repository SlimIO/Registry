"use strict";

// Require Third-party Dependencies
const Sequelize = require("sequelize");

/**
 * @function exportModels
 * @param {*} database
 * @returns {any}
 */
function exportModels(database) {
    /* eslint-disable new-cap */
    const Users = database.define("users", {
        username: {
            type: Sequelize.STRING(40),
            allowNull: false,
            validate: { len: [2, 40] }
        },
        active: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        password: { type: Sequelize.STRING(240), allowNull: false }
    });

    const Tokens = database.define("tokens", {
        token: {
            type: Sequelize.STRING(36),
            allowNull: false
        }
    });
    Users.hasOne(Tokens, { foreignKey: "userId" });
    Tokens.belongsTo(Users, {
        as: "user",
        foreignKey: { allowNull: false },
        onDelete: "CASCADE"
    });

    const Organisation = database.define("organisation", {
        name: {
            type: Sequelize.STRING(35),
            allowNull: false,
            validate: { len: [2, 35] }
        },
        description: { type: Sequelize.STRING(120), allowNull: true }
    });
    Organisation.belongsTo(Users, { as: "owner", foreignKey: { allowNull: false } });
    Organisation.belongsToMany(Users, {
        through: "OrgaUsers",
        foreignKey: "organisationId",
        otherKey: "userId",
        onDelete: "CASCADE"
    });
    Users.belongsToMany(Organisation, {
        through: "OrgaUsers",
        foreignKey: "userId",
        otherKey: "organisationId",
        onDelete: "CASCADE"
    });

    const Version = database.define("version", {
        version: {
            type: Sequelize.STRING(20),
            allowNull: false
        }
    },
    { updatedAt: false });

    const Addons = database.define("addons", {
        name: {
            type: Sequelize.STRING(35),
            allowNull: false,
            validate: { len: [2, 35] }
        },
        description: { type: Sequelize.STRING(120), allowNull: true },
        git: { type: Sequelize.STRING(120), allowNull: false }
    });
    Users.hasMany(Addons, { foreignKey: "authorId" });
    Addons.belongsTo(Users, { as: "author", foreignKey: { allowNull: false }, onDelete: "CASCADE" });
    Addons.belongsTo(Organisation);
    Organisation.hasMany(Addons, { foreignKey: "organisationId" });
    Addons.hasMany(Version, { onDelete: "CASCADE" });

    return { Users, Organisation, Addons, Version, Tokens };
}


module.exports = exportModels;
