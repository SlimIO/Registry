// Require Third-party Dependencies
const argon2 = require("argon2");

/**
 * @async
 * @function encrypter
 * @return {Promise<void>}
 */
async function encrypter() {
    const hash = await argon2.hash("Votre Mot de passe");
    console.log(hash);
}
encrypter().catch(console.error);
