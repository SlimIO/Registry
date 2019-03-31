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
    version: "required|string"
};

module.exports = {
    user, addon, publish
};
