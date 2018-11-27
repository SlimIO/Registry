# addon-registry
SlimIO - Addon registry

# Description du chantier
Création d'une API HTTP pour récupérer des informations sur les Addons SlimIO actuellement disponible (CPU, Memory, etc). Les informations seront stockées dans une base de données (MariaDB pour être précis). L'API doit répondre en JSON (`application/json`)

Plus tard cet API pourra permettre:
- L'authentification d'un utilisateur par token.
- Publication d'un Addon.

## Packages / Techno

- [polka](https://github.com/lukeed/polka#readme) - Création d'un serveur (API) http Node.js
- [connecteur MariaDB](https://github.com/MariaDB/mariadb-connector-nodejs) - Pour requêter la base de donnée MariaDB

## Routes HTTP
L'API expose plusieurs `endpoint` (des routes HTTP).

> ### (GET) /
La route principale doit retourner les métas data du service. (uptime, etc).

Exemple de réponse avec le endpoint du registry npm: https://registry.npmjs.org/

```json
{
    "uptime": "2018-11-27T02:29:08.808Z"
}
```

> ### (GET) /addons
Récupère la liste entière des addons en base. (Uniquement les addons publiques). Une clé sera éventuellement nécessaire pour voir les addons privés.

Exemple de retour
```json
[
    "cpu",
    "memory",
    "winni"
]
```

> ### (GET) /addon/:addonName
Permet de récupérer les données d'un addon. (nom, description, version, lien git, etc..).

Exemple de retour:
```json
{
    "name": "cpu",
    "version": "1.0.0",
    "author": "SlimIO",
    "git": "https://github.com/SlimIO/cpu.git"
}
```
