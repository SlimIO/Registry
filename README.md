# Registry

Registry is an **HTTP API** whose main purpose is to manage addons with users and organisations.

In other words, it's an NPM like.

# Important packages used

- Serveur HTTP [Polka](https://github.com/lukeed/polka)
- Token [JsonWebToken](https://github.com/auth0/node-jsonwebtoken)
- ORM [Sequelize](https://github.com/sequelize/sequelize) - [v4](http://docs.sequelizejs.com/)
    - [MariaDB](https://mariadb.org/)
    - [Sqlite](https://github.com/kriasoft/node-sqlite#readme)


# Getting Started

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
```

# API

For all request with a body data, you need to set your headers with:
- Content-Type: `application/json`

| icon | description |
| --- | --- |
| 🔑 | ⚠️ You need to be authenticated to use this route: see **/login** |

<br />
<details>
    <summary>POST : /login</summary>

Endpoint to authenticate a user. The HTTP request **body** must contains the following fields:
```ts
{
    username: string,
    password: string
}
```

The API return an access_token which will be required for some endpoints.

```ts
{
    access_token: string;
}
```
<br>
</details>

## User

<details>
    <summary>POST : /users</summary>
Endpoint to create an user.

```ts
{
    username: string,
    password: string
}
```

Return an user id
<br>
</details>

## Addon

<details>
    <summary>GET : /addon</summary>
Get all addons

Return a data structure like:
```ts
[
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
        organisations: {
            name: string,
            createdAt: Date,
            updatedAt: Date
        },
        version: [
            {
                version: string,
                createdAt: string
            }
        ]
    }
]
```
<br>
</details>

<details>
    <summary>GET : /addon/:addonName</summary>

Get an addon by name

Return a data structure like:
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
    organisations: {
        name: string,
        createdAt: Date,
        updatedAt: Date
    },
    version: [
        {
            version: string,
            createdAt: string
        }
    ]
}
```

<br>
</details>

<details>
    <summary>🔑 POST : /addon</summary>

Create an addon

Headers:
```ts
{
    Content-Type: `application/json`,
    authorization: access_token
}
```

Body Object:
```ts
{
    name: string,
    description: string,
    version: string,
    git: string,
    organisation?: string
}
```

Return an addon id

<br>
</details>


## Organisation

<details>
    <summary>GET : /organisation</summary>
Get all organisations

Return a data structure like:
```ts
[
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
]
```
<br>
</details>

<details>
    <summary>GET : /organisation/:name</summary>
Get an organisation by name

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

<details>
    <summary>🔑 POST : /organisation</summary>

Create an organisation

Headers:
```ts
{
    Content-Type: `application/json`,
    authorization: access_token
}
```

Body Object:
```ts
{
    name: string,
    description: string
}
```

Return an organisation id

<br>
</details>

<details>
    <summary>🔑 POST : /organisation/:orgaName/:userName</summary>

Add an user to an organisation

Headers:
```ts
{
    authorization: access_token
}
```

Return an user id

<br>
</details>

# License
MIT

