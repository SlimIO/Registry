// Require Third-party Dependencies
const jwt = require("jsonwebtoken");
const send = require("@polka/send-type");

// CONSTANTS
const SECRET_KEY = process.env.SECRET_KEY || "default_secret";

function isAuthenticated(req, res, next) {
    jwt.verify(req.headers.authorization, SECRET_KEY, (err, user) => {
        if (err) {
            return send(res, 401, "Invalid Token");
        }
        req.user = user;

        return next();
    });
}

module.exports = { isAuthenticated, SECRET_KEY };
