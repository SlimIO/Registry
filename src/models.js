const Sequelize = require("sequelize");

function exportModels(dataBase) {
/* eslint-disable new-cap */
    const Users = dataBase.define("users", {
        username: {
            type: Sequelize.STRING(40),
            allowNull: false,
            validate: { len: [2, 40] }
        },
        password: { type: Sequelize.STRING(240), allowNull: false }
    });

    const Addons = dataBase.define("addons", {
        name: {
            type: Sequelize.STRING(35),
            allowNull: false,
            validate: { len: [2, 35] }
        },
        description: { type: Sequelize.STRING(120), allowNull: true },
        version: { type: Sequelize.STRING(20), allowNull: false },
        author: { type: Sequelize.INTEGER, allowNull: false },
        git: { type: Sequelize.STRING(120), allowNull: false }
    });

    return { Users, Addons };
}


module.exports = exportModels;
