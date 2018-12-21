// Require Third-party Dependencies
const sqlite = require("sqlite");

// admin password
const password = "$argon2i$v=19$m=4096,t=3,p=1$shqNmzJ5QQxei83cWTpOig$wLyf6L28iqTKnMi9J7aHCFzZssDaeU33w0UYtyJk1ak";

/**
 * @async
 * @function addData
 * @returns {Promise<void>}
 */
async function addData() {
    const db = await sqlite.open("../database.sqlite");

    // Insert into addons
    await db.exec(`INSERT INTO "addons"
    ("name", "description", "version", "author", "git")
VALUES
    ("cpu", "addon cpu", "1.0.0", "SlimIO", "https://github.com/SlimIO/cpu.git"),
    ("Winmem", "addon winem", "1.1.0", "SlimIO", "https://github.com/SlimIO/Winmem.git");
`);

    // Insert into users
    await db.exec(`INSERT INTO "users"
    ("username", "password")
VALUES
    ("admin", "${password}"),
    ("alexandre", "${password}"),
    ("guest", "guest"),
    ("irvin", "${password}"),
    ("marco", "${password}"),
    ("thomas", "${password}");
`);
    // Insert into orga
    await db.exec(`INSERT INTO "orga"
    ("name")
VALUES
    ("slimio"),
    ("private"),
    ("public");
`);
    // Insert into slimio_user
    await db.exec(`INSERT INTO "slimio_user"
    ("user_id", "orga_id")
VALUES
    ("1", "1"),
    ("2", "1"),
    ("4", "1"),
    ("5", "1"),
    ("6", "1");
`);
    // Insert into private_user
    await db.exec(`INSERT INTO "private_user"
    ("user_id", "orga_id")
VALUES
    ("1", "2"),
    ("2", "2"),
    ("4", "2"),
    ("5", "2"),
    ("6", "2");
`);
    // Insert into public_user
    await db.exec(`INSERT INTO "public_user"
    ("user_id", "orga_id")
VALUES
    ("1", "3"),
    ("2", "3"),
    ("3", "3"),
    ("4", "3"),
    ("5", "3"),
    ("6", "3");
`);
}
addData().catch(console.error);

