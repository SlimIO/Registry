require("dotenv").config();
require("make-promises-safe");

// Require Node.js Dependencies
const { unlink } = require("fs").promises;
const { join } = require("path");

// Require Third-party Dependencies
const Sequelize = require("sequelize");
const argon2 = require("argon2");
const { get } = require("httpie");

// Require Internal Dependencies
const models = require("../src/models");

// CONSTANTS
const DB_PATH = join(__dirname, "..", "database.sqlite");
const ADDONS = [
    "SlimIO/cpu-addon",
    "SlimIO/ihm"
];

async function main() {
    try {
        await unlink(DB_PATH);
    }
    catch (err) {
        // Ignore
    }

    const sequelize = new Sequelize(DB_PATH, "username", null, {
        storage: DB_PATH,
        dialect: "sqlite",
        logging: false
    });

    const tables = models(sequelize);
    await sequelize.sync({ force: true });

    // Create default user
    const user = await tables.Users.create({
        username: "administrator",
        password: await argon2.hash(process.argv[2] || "administrator")
    });

    const org = await tables.Organisation.create({
        name: "SlimIO",
        description: "SlimIO Official Organisation",
        ownerId: user.id
    });

    for (const fullName of ADDONS) {
        const packageURL = new URL(`https://api.github.com/repos/${fullName}/contents/package.json`);
        const { data } = await get(packageURL, {
            headers: {
                "User-Agent": "SlimIO",
                Authorization: `token ${process.env.GIT_TOKEN}`,
                Accept: "application/vnd.github.v3.raw"
            }
        });

        const { name, description, version } = JSON.parse(data);
        const cleanName = name.charAt(0) === "@" ? name.split("/")[1] : name;

        console.log(`Create addon '${fullName}'`);
        await tables.Addons.create({
            name: cleanName,
            description,
            version,
            authorId: user.id,
            git: `https://github.com/${fullName}.git`,
            organisationId: org.id
        });
    }
}
main().catch(console.error);
