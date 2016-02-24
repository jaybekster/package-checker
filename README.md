# package-checker
A simple plugin to compare currently installed packages with list in package.json file.
## Installation
project:
`npm install package-checker --save-dev`

global:
`npm install package-checker -g`
## Usage
project:
```js
var packageChecker = require('package-checker');
packageChecker(options, callback);
```
global:
`package-checker [options]`

## API
### package-checker [options]
#### options
##### -d, --dev
Type: `boolean`

Default: `true`

Check `dependencies` from `package.json` file
##### -p, --prod
Type: `boolean`

Default: `true`

Check `devDependencies` from `package.json` file
##### -D, --directory
Type: `string`

Default: `process.cwd()`

Path to directory having `node_modules` directory
##### -P, --path
Type: `string`

Default: `process.cwd() + '/package.json'`

Path to `package.json` file
##### -v, --version
Print current version of `package-checker`
##### -h, --help
Print help information
### package-checker([options, callbak])
#### options
##### path
The same as `--path` for CLI tool
##### directory
The same as `--dir` for CLI tool
##### prod
The same as `--prod` for CLI tool
##### dev
The same as `--dev` for CLI tool
### callback
Type: `function`

Arguments: `error`, `output`
