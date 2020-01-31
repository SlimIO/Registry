"use strict";

// Require Third-party Dependencies
const jwt = require("jsonwebtoken");
const send = require("@polka/send-type");
const { validate } = require("indicative/validator");

// CONSTANTS
const SECRET_KEY = process.env.SECRET_KEY || "default_secret";
const CODES = Object.freeze({
    UNAUTHORIZED: "ERR_UNAUTHORIZED",
    NOTFOUND: "ERR_NOTFOUND",
    EEXIST: "ERR_EEXIST"
});
const INTERNAL_ERROR = createHTTPError("Internal Server Error!");

/**
 * @function isAuthenticated
 * @description Middleware to detect if the user is authenticated with the given token
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function isAuthenticated(req, res, next) {
    jwt.verify(req.headers.authorization, SECRET_KEY, (err, user) => {
        if (err) {
            return send(res, 401, "Invalid Token");
        }
        req.user = user;

        return next();
    });
}

/**
 * @function validationMiddleware
 * @param {any} schema
 * @param {object} options
 * @returns {any}
 */
function validationMiddleware(schema = {}, options = {}) {
    const { params = false } = options;

    return async(req, res, next) => {
        try {
            await validate(params ? req.params : (req.body || {}), schema);

            return next();
        }
        catch (error) {
            const message = Array.isArray(error) ? error[0].message : toString(error);

            return send(res, 400, message);
        }
    };
}

/**
 * @function createHTTPError
 * @param {string[]} messages
 * @returns {object}
 */
function createHTTPError(...messages) {
    // eslint-disable-next-line arrow-body-style
    const errors = messages.map((message) => {
        return typeof message === "string" ? { code: null, message } : message;
    });

    return { errors };
}

module.exports = {
    isAuthenticated,
    validationMiddleware,
    createHTTPError,
    CODES,
    INTERNAL_ERROR,
    SECRET_KEY
};
