# addon-registry
This addon is an API that create an http server for you, using the polka package.

[Polka](https://github.com/lukeed/polka)

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

## Set your Environment

For the API to work, you must create a file named ".env" at the root of the location where you previously installed the addon-registry addon.

```bash
$ touch .env
```

Open it with
```bash
$ code .env
```

add thoses environement variables and save it

```js
registry_secret=your_secret_key
PORT=1337
```

## LICENSE
MIT

