'use strict';

var semver = require('semver'),
    objectAssign = require('object-assign'),
    textTable = require('text-table'),
    chalk = require('chalk'),
    version = require('./package.json').version,
    cacheToFile = require('./lib/cache-to-file.js'),
    readPackageJson = require('./lib/read-package-json'),
    getCurrentNpmLs = require('./lib/get-current-npm-ls');

var textTableObj = {
    header: [
        ['Name', 'Current', 'Wanted', 'Problem']
    ],
    options: {
        align: ['l', 'l', 'l', 'l']
    }
};

var SETTINGS = {
    path: process.cwd() + '/package.json',
    directory: process.cwd(),
    prod: true,
    dev: true,
    hashFile: false
};

var gitHubPublicRe = /^https:\/\/github.com\/([^\/])+\/([^\/]+\.git)#([0-9]+\.[0-9]+\.[0-9]+)$/;

/**
 * comparePackages compare data from <npm -ls> command and <package.json>
 * @param  {Object} options
 * @param  {Function} callback
 * @return {Promise}
 */
function comparePackages(options, callback) {
    var output = {};

    return Promise.all([
        readPackageJson(options),
        getCurrentNpmLs(options),
    ]).then(function(values) {
        var packageName,
            currentPackages = values[1],
            actualPackages = values[0],
            packageVersion,
            tableBody = [],
            packageJsonVersion;

        for (packageName in actualPackages) {
            output[packageName] = {};
            output[packageName].actualVersion = actualPackages[packageName];

            if (!currentPackages[packageName] || currentPackages[packageName].missing) {
                tableBody.push([packageName, '', actualPackages[packageName], 'is missing'])
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
                output[packageName].actualVersion = packageJsonVersion;
                output[packageName].relevantVersion = packageVersion;
                tableBody.push([packageName, packageVersion, packageJsonVersion, 'invalid version']);
            }
        }
        if (tableBody.length) {
            console.log(
                textTable([].concat(textTableObj.header, tableBody), textTableObj.options)
            );
            throw new Error('Differences were found');
        } else {
            console.log(chalk.green('No differences were found'));
            callback(null, output);
        }
    }).catch(function(error) {
        console.log(chalk.red(error));
        callback(error, output);
    });
}

/**
 * checkHashSum check hashsum of <package.json> file to make sure if it was changed
 * @param  {Object} options
 * @return {Promise}
 */
function checkHashSum(options) {
    return cacheToFile(options.hashFile, options.path);
}

/**
 * packageChecker
 * @param  {Object} options
 * @return {Promise}
 */
function packageChecker(options, callback) {
    var callback = (typeof options === 'object' ? callback : options) || function() {},
        options = objectAssign(SETTINGS, (typeof options === 'object' ? options : callback) || {}),
        error = null;

    if (typeof callback !== "function") {
        throw new Error("Invalid argument: callback");
    }

    return Promise.resolve(options.hashFile ? checkHashSum(options) : null).then(function(isHashsumOk) {
        if (isHashsumOk) {
            console.log(chalk.green('The package.json file wasn\'t changed'));
            callback(null, null);
        } else {
            return comparePackages(options, callback);
        }
    }).catch(function(error) {
        console.log(chalk.red(error));
        callback(error, null);
    });

}

packageChecker.version = version;

module.exports = packageChecker;
