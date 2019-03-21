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

## Env file

You must create a file named `.env` at the root of the project.
```bash
$ touch .env
```

Add these environment variables and save them, you can change the values ​​of these keys according to your needs
```js
registry_secret=your_secret_key
PORT=1337
```

# API

For all request with a body data, you need to set your headers with:
- Content-Type: `application/json`

<details>
    <summary>POST : /login</summary>
Login to get token

```ts
{
    access_token: string
}
```
<br>
</details>

## User

<details>
    <summary>POST : /users</summary>

Body Object:
- username: string,
- password: string

<br>
</details>

## Addon

<details>
    <summary>GET : /addon</summary>
Get all addons

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
            description: string,
        },
        organisations: {
            name: string
            createdAt: Date,
            updatedAt: Date,
        },
        version: [ string ]
    }
]
```
<br>
</details>

<details>
    <summary>GET : /addon/:addonName</summary>

```ts
{
    name: string,
    description: string,
    git: string,
    createdAt: Date,
    updatedAt: Date,
    author: {
        username: string,
        description: string,
    },
    organisations: {
        name: string
        createdAt: Date,
        updatedAt: Date,
    },
    version: [ string ]
}
```

<br>
</details>

<details>
    <summary>POST : /addon</summary>

> Need to be authenticate: /login

Create an addon

Headers:
- authorization: token

Body Object:
- name: string,
- description: string
- version: string
- organisation?: string
- git: string

<br>
</details>


## Organisation

<details>
    <summary>GET : /organisation</summary>
Get all organisations

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
Get organisation by name

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
    <summary>POST : /organisation</summary>

> Need to be authenticate: /login

Create an organisation

Headers:
- authorization: token

Body Object:
- name: string,
- description: string

<br>
</details>

<details>
    <summary>POST : /organisation/:orgaName/:userName</summary>

> Need to be authenticate: /login

Add user to an organisation

Headers:
- authorization: token

<br>
</details>

# LICENSE
MIT

