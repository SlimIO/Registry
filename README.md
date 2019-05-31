# Registry
![version](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/SlimIO/Registry/master/package.json?token=AOgWw3vrgQuu-U4fz1c7yYZyc7XJPNtrks5catjdwA%3D%3D&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/SlimIO/Registry/commit-activity)
![MIT](https://img.shields.io/github/license/mashape/apistatus.svg)
![dep](https://img.shields.io/david/SlimIO/Registry.svg)
![size](https://img.shields.io/github/repo-size/SlimIO/Registry.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/SlimIO/Registry/badge.svg?targetFile=package.json)](https://snyk.io/test/github/SlimIO/Registry?targetFile=package.json)
[![Build Status](https://travis-ci.com/SlimIO/Registry.svg?branch=master)](https://travis-ci.com/SlimIO/Registry)
[![Greenkeeper badge](https://badges.greenkeeper.io/SlimIO/Registry.svg)](https://greenkeeper.io/)

Registry is an **HTTP API** whose main purpose is to manage SlimIO Addons. The API let you create your own account and manage an  organisation to publish and edit your personal and/or company addon(s).

This project has been inspired by **npm** Registry.

## Requirements

- Node.js v10 or higher
- A local [MariaDB](https://mariadb.org/) database (else setup the project for SQLite).

## Getting Started

First, clone and install the project
```bash
$ git clone https://github.com/SlimIO/Registry.git
$ cd Registry
$ npm ci
```

Then, you must create a file named `.env` at the root of the project.
```bash
$ touch .env
```

Add these environment variables and save them, you can change the values ​​of these keys according to your needs
```js
SECRET_KEY=your_secret_key
PORT=1337

DB_DIALECT=sqlite
DB_NAME=registry
DB_USER=root
DB_PASSWORD=ROOT
```

Supported dialect are: `mysql`, `sqlite`, `postgres`, `mssql`.

## DB Schema

<p align="center">
    <img src="https://i.imgur.com/h0KRpsa.jpg">
</p>

## Endpoints

For all request with a body data, you need to set your headers with:
- Content-Type: `application/json`

| icon | description |
| --- | --- |
| 🔑 | ⚠️ You need to be authenticated to use this route: see **/login** |

<br />

### Meta endpoints

<details><summary>GET ·/</summary>
<br />

Return service metadata.

| Name | Value | Kind | Required? | Notes |
| --- | --- | --- | --- | --- |

```js
{
    uptime: 3403
}
```

</details>

### User endpoints

<details><summary>POST ·/login</summary>
<br />

Authenticate a user and get an AccessToken.

| Name | Value | Kind | Required? | Notes |
| --- | --- | --- | --- | --- |
| username | String | Body | ✅ | User name |
| password | String | Body | ✅ | User password |

Return an AccessToken which will be required for some endpoints.
```ts
{
    access_token: string;
}
```

</details>

<details><summary>POST ·/users</summary>
<br />

Create a new user.

| Name | Value | Kind | Required? | Notes |
| --- | --- | --- | --- | --- |
| username | String | Body | ✅ | User name |
| password | String | Body | ✅ | User password |

Return a JSON with the **userId** field.
```js
{
    userId: 1
}
```

</details>

### Addon endpoints

<details><summary>GET ·/addon</summary>
<br />

Get all available addons.

| Name | Value | Kind | Required? | Notes |
| --- | --- | --- | --- | --- |

```js
[
    "cpu",
    "memory"
]
```

</details>

<details><summary>GET ·/addon/{addonName}</summary>
<br />

Get a given addon by his name.

| Name | Value | Kind | Required? | Notes |
| --- | --- | --- | --- | --- |
| addonName | String | Path | ✅ | Addon name |

Return a data structure described by the following interface:
```ts
{
    name: string,
    description: string,
    git: string,
    createdAt: Date,
    updatedAt: Date,
    author: {
        username: string,
        description: string
    },
    organisation: {
        name: string,
        createdAt: Date,
        updatedAt: Date
    },
    versions: [
        {
            version: string,
            createdAt: string
        }
    ]
}
```

</details>

<details><summary>🔑 POST ·/addon/publish</summary>
<br />

Create or update an Addon release. This endpoint require an AccessToken.

| Name | Value | Kind | Required? | Notes |
| --- | --- | --- | --- | --- |
| name | String | Body | ✅ | Addon name |
| description | String | Body | ❌ | Addon description |
| version | String | Body | ✅ | Semver |
| git | String | Body | ✅ | GIT Url |
| organisation | String | Body | ❌ | Organisation (if any) |

Return the addon id.
```js
{
    addonId: 1
}
```

</details>

### Organisation endpoints

<details><summary>GET ·/organisation</summary>
<br />

Get all organisations.

| Name | Value | Kind | Required? | Notes |
| --- | --- | --- | --- | --- |

Return an JavaScript Object described by the following interface:
```ts
{
    [name: string]: {
        description: string,
        owner: string,
        users: string[]
        addons: string[]
    }
}
```
<br>
</details>

<details><summary>GET ·/organisation/{name}</summary>
<br />

Get an organisation by his name.

| Name | Value | Kind | Required? | Notes |
| --- | --- | --- | --- | --- |
| name | String | Path | ✅ | Organisation name |

Return a data structure like:
```ts
{
    name: string,
    description: string,
    createdAt: Date,
    updatedAt: Date,
    owner: {
        username: string,
        createdAt: Date,
        updatedAt: Date
    },
    users: [
        {
            username: string,
            createdAt: Date,
            updatedAt: Date
        }
    ]
    addons: [
        {
            name: string,
            description: string,
            git: string,
            createdAt: Date,
            updatedAt: Date
        }
    ]
}
```
<br>
</details>

<details><summary>🔑 POST : /organisation/:orgaName/:userName</summary>
<br />

Add a user to an organisation. This endpoint require an AccessToken.

| Name | Value | Kind | Required? | Notes |
| --- | --- | --- | --- | --- |
| orgaName | String | Path | ✅ | Organisation name |
| userName | String | Path | ✅ | User name |

> ⚠️ Only Organisation owner can use this endpoint.

Return the following interface:
```ts
{
    createdAt: date,
    updatedAt: date,
    organisationId: number,
    userId: number
}
```

<br>
</details>

## Dependencies

|Name|Refactoring|Security Risk|Usage|
|---|---|---|---|
|[@polka/send-type]()|Minor|Low|TBC|
|[@slimio/is](https://github.com/SlimIO/is#readme)|Minor|Low|Type Checker|
|[argon2](https://github.com/ranisalt/node-argon2#readme)|⚠️Major|High|Crypto package|
|[body-parser](https://github.com/expressjs/body-parser#readme)|Minor|High|Body Parser|
|[dotenv](https://github.com/motdotla/dotenv#readme)|Minor|Low|Load local .env in process.env|
|[indicative](https://github.com/poppinss/indicative#readme)|Minor|Low|Validator|
|[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken#readme)|⚠️Major|High|JWT Token|
|[kleur](https://github.com/lukeed/kleur#readme)|Minor|Low|Colors for TTY|
|[make-promises-safe](https://github.com/mcollina/make-promises-safe#readme)|⚠️Major|Medium|Force Node.js DEP00018|
|[polka]()|⚠️Major|Low|HTTP Server|
|[semver](https://github.com/npm/node-semver#readme)|Minor|Low|SemVer validation|
|[semver-sort](https://github.com/ragingwind/semver-sort#readme)|Minor|Low|Sort SemVer versions|
|[sequelize](http://docs.sequelizejs.com/)|⚠️Major|High|ORM|
|[sqlite3](http://github.com/mapbox/node-sqlite3)|⚠️Major|High|SQLite|

## License
MIT

