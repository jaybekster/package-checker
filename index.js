'use strict';

var semver = require('semver'),
    prcoess = require('process'),
    version = require('./package.json').version,
    readPackageJson = require('./lib/read-package-json'),
    getCurrentNpmLs = require('./lib/get-current-npm-ls');

const SETTINGS = {
    path: process.cwd() + '/package.json',
    directory: process.cwd(),
    prod: true,
    dev: true
};

const gitHubPublicRe = /^https:\/\/github.com\/([^\/])+\/([^\/]+\.git)#([0-9]+\.[0-9]+\.[0-9]+)$/;

/**
 * checkDeps check fiddeferecies between version from npm ls command and package.json
 * @param  {Object} options
 * @return {undefined}
 */
function packageChecker(options, callback) {
    var callback = (typeof options === 'object' ? callback : options) || function() {},
        options = Object.assign(SETTINGS, (typeof options === 'object' ? options : callback) || {}),
        error = null;

    return Promise.all([
        readPackageJson(options),
        getCurrentNpmLs(options)
    ]).then(function(values) {
        var packageName,
            output = {},
            currentPackages = values[1],
            actualPackages = values[0],
            packageVersion,
            packageJsonVersion;

        for (packageName in actualPackages) {
            output[packageName] = {};
            output[packageName].actualVersion = actualPackages[packageName];

            if (!currentPackages[packageName] || currentPackages[packageName].missing) {
                output[packageName].error = 'is missing';
                continue;
            }

            packageJsonVersion = actualPackages[packageName];
            packageVersion = currentPackages[packageName].version;

            if (gitHubPublicRe.test(packageJsonVersion)) { // if public github url
                packageJsonVersion = packageJsonVersion.match(gitHubPublicRe)[3];
            }

            if (semver.validRange(packageJsonVersion)
                && packageVersion !== packageJsonVersion
                && !semver.satisfies(packageVersion, packageJsonVersion)
            ) {
                output[packageName].error = 'invalid version';
                output[packageName].actualVersion = packageJsonVersion;
                output[packageName].relevantVersion = packageVersion;
            }
        }

        callback(null, output);
    }, function(error) {
        callback(error, null);
    });
}

packageChecker.version = version;

module.exports = packageChecker;
