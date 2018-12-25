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

## LICENSE
MIT

