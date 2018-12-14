// Require Third-party Dependencies
const sqlite = require("sqlite");

const password = "$argon2i$v=19$m=4096,t=3,p=1$r3zK73hnytJvzAwCpYMjqA$fPgLj04XLuDZmxQIxJyPhgNGGFjExhY07y4FQI8oZBk";

async function addData() {
    const db = await sqlite.open("../database.sqlite");
    await db.exec(`INSERT INTO "addons"
    ("name", "description", "version", "author", "git")
VALUES
    ("cpu", "addon cpu", "1.0.0", "SlimIO", "https://github.com/SlimIO/cpu.git"),
    ("Winmem", "addon winem", "1.1.0", "SlimIO", "https://github.com/SlimIO/Winmem.git");


    INSERT INTO "users"
    ("username", "password")
VALUES
    ("admin", ${password});
`);
}
addData().catch(console.error);
