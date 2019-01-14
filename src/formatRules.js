const addonForm = {
    name: "required|string|min:2",
    description: "required|string",
    version: "required|string",
    author: "required|string",
    git: "required|string"
};

const loginForm = {
    username: "required|string|min:2|max:30",
    password: "required|string"
};

module.exports = {
    addonForm,
    loginForm
};
