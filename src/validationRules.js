// Require Third-party Dependencies
const { validations } = require("indicative");
const semver = require("semver");

// eslint-disable-next-line
validations.semver = function (data, field, message, args, get) {
    return new Promise((resolve, reject) => {
        const fieldValue = get(data, field);

        if (fieldValue && semver.valid(fieldValue) === null) {
            return reject(message);
        }

        return resolve("validation passed");
    });
};

const user = {
    username: "required|string|max:40",
    password: "required|string|min:6"
};

const addon = {
    addonName: "required|string|min:2|max:35"
};

const publish = {
    name: "required|string|min:2|max:35",
    description: "string|max:120",
    git: "required|string|max:120",
    version: "required|string|semver"
};

module.exports = {
    user, addon, publish
};
