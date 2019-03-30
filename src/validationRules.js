const user = {
    username: "required|string|max:40",
    password: "required|string|min:6"
};

const addon = {
    addonName: "required|string|min:2|max:30"
};

module.exports = {
    user, addon
};
