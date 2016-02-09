'use strict';

var semver = require('semver'),
    prcoess = require('process'),
    Spinner = require('cli-spinner').Spinner,
    readPackageJson = require('./lib/read-package-json'),
    getCurrentNpmLs = require('./lib/get-current-npm-ls');

const SETTINGS = {
    path: process.cwd() + '/package.json',
    directory: process.cwd(),
    prod: true,
    dev: true
};

/**
 * checkDeps check fiddeferecies between version from npm ls command and package.json
 * @param  {Object} options
 * @return {undefined}
 */
function checkDeps(options) {
    var spinner = new Spinner('%s'),
        options = Object.assign(SETTINGS, options);

    spinner.setSpinnerString('|/-\\');
    spinner.start();

    return Promise.all([
        readPackageJson(options),
        getCurrentNpmLs(options)
    ]).then(function(values) {
        var packageName,
            output = {},
            currentPackages = values[1],
            actualPackages = values[0];

        spinner.stop();
        process.stdout.write('\n');

        for (packageName in actualPackages) {
            output[packageName] = {};
            output[packageName].actualVersion = actualPackages[packageName];
            if (!currentPackages[packageName] || currentPackages[packageName].missing) {
                output[packageName].error = 'is missing';
                continue;
            }

            if (actualPackages[packageName]
                && semver.validRange(actualPackages[packageName])
                && currentPackages[packageName].version !== actualPackages[packageName]
                && !semver.satisfies(currentPackages[packageName].version, actualPackages[packageName])
            ) {
                output[packageName].error = 'invalid version';
                output[packageName].actualVersion = actualPackages[packageName];
                output[packageName].relevantVersion = currentPackages[packageName].version;
            }
        }
        return output;
    }, function(err) {
        console.log(err);
    }).catch(function(err) {
        console.log(err);
    });
}

/**
 * runCheckDeps
 * @param  {Object}   config
 * @param  {Function} callback
 * @return {Promise}
 */
function runCheckDeps(config, callback) {
    var error = null,
        callback = typeof config === 'object' ? callback : config;

    return checkDeps(config || {}).then(function(output) {
        callback(error, output)
    }).catch(function(error) {
        callback(error, null);
    });
}

module.exports = runCheckDeps;
