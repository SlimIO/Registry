# addon-registry
This addon is an API that creates an http server using the polka package whose main purpose is to be able to access information through the database system (sqlite) and to publish new addons.
(In the near future this addon will use MariaDb for the management of the database).

[Polka](https://github.com/lukeed/polka)
-
[Sqlite](https://github.com/kriasoft/node-sqlite#readme)
-

# Getting Started
This addon is available in the Node Package Repository and can be easily installed with npm or yarn.

```bash
$ npm i @slimio/addon-registry
# or
$ yarn add @slimio/addon-registry
```
Enter in directory
```bash
$ cd addon-registry
```
## First step
---
### Set your Environment :
For the API to work, you must create a file named ".env" at the root of the location where you previously installed the addon-registry addon.

```bash
$ touch .env
```

Open it with
```bash
$ code .env
```


add these environment variables and save them, you can change the values ​​of these keys according to your needs

```js
registry_secret=your_secret_key
PORT=1337
```
## Next step :
---
in order to use the API of this addon you have to execute the hydrate.js file in the src directory
```bash
$ cd scripts
$ node hydrate.js
```

## API

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

### User
<details>
    <summary>GET : /users</summary>
Get all users

```ts
[
    {
        username: string,
        createdAt: Date,
        updatedAt: Date,
        organisations: [
            {
                name: string
            }
        ],
        addons: [
            {
                name: string,
                description: string,
            }
        ]
    }
]
```
<br>
</details>

<details>
    <summary>GET : /users/:userName</summary>
Get user by name

```ts
{
    username: string,
    createdAt: Date,
    updatedAt: Date,
    username: string,
    organisations: [
        {
            name: string
        }
    ],
    addons: [
        {
            name: string,
            description: string,
        }
    ]
}
```
<br>
</details>

<details>
    <summary>POST : /users</summary>

Body Object:
- username: string,
- password: string

<br>
</details>

### Addon

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


### Organisation

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

## LICENSE
MIT

