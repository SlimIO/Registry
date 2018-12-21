require("make-promises-safe");

// Require Third-party Dependencies
const sqlite = require("sqlite");
const env = require("dotenv").config();

// Require Internal Dependencies
const server = require("./src/httpServer");

// CONSTANTS
const PORT = env.parsed.PORT;

async function main() {
    const db = await sqlite.open("./database.sqlite");

    server.use((req, res, next) => {
        req.db = db;
        next();
    });

    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
main().catch(console.error);
