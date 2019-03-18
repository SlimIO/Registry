// Require Third-party Dependencies
const Sequelize = require("sequelize");
const is = require("@slimio/is");
const semver = require("semver");


function exportModels(database) {
    /* eslint-disable new-cap */
    const Users = database.define("users", {
        username: {
            type: Sequelize.STRING(40),
            allowNull: false,
            validate: { len: [2, 40] }
        },
        password: { type: Sequelize.STRING(240), allowNull: false }
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
            allowNull: false,
            validate: {
                semver: (val) => {
                    if (is.nullOrUndefined(semver.valid(val))) {
                        throw new Error("version must be like a semver");
                    }
                }
            }
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

    return { Users, Organisation, Addons, Version };
}


module.exports = exportModels;
