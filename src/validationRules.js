const user = {
    username: "required|string",
    password: "required|string"
};

const addon = {
    addonName: "required|string|min:2"
};

module.exports = {
    user, addon
};
