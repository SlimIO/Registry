"use strict";

// Require Third-party Dependencies
const { validations, extend } = require("indicative/validator");
const { getValue } = require("indicative-utils");
const semver = require("semver");

extend("semver", {
    async: false,
    validate(data, field) {
        const fieldValue = getValue(data, field);

        return !(fieldValue && semver.valid(fieldValue) === null);
    }
});

const user = {
    username: [
        validations.required(),
        validations.string(),
        validations.max([40])
    ],
    password: [
        validations.required(),
        validations.string(),
        validations.min([6])
    ]
};

const userRegistration = {
    username: [
        validations.required(),
        validations.string(),
        validations.max([40])
    ],
    password: [
        validations.required(),
        validations.string(),
        validations.min([6])
    ],
    email: [
        validations.required(),
        validations.email()
    ]
};

const addon = {
    addonName: [
        validations.required(),
        validations.string(),
        validations.min([2]),
        validations.max([35])
    ]
};

const publish = {
    name: [
        validations.required(),
        validations.string(),
        validations.min([2]),
        validations.max([35])
    ],
    description: [
        validations.string(),
        validations.max([120])
    ],
    git: [
        validations.required(),
        validations.string(),
        validations.max([120])
    ],
    version: [
        validations.required(),
        validations.string(),
        validations.semver()
    ]
};

module.exports = {
    user, userRegistration, addon, publish
};
