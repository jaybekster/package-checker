'use strict';

var semver = require('semver'),
    objectAssign = require('object-assign'),
    textTable = require('text-table'),
    chalk = require('chalk'),
    version = require('./package.json').version,
    CacheToFile = require('./lib/cache-to-file.js'),
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
 * comparePackages compare data from <npm ls> command and <package.json>
 * @param  {Object} options
 * @param  {Function} callback
 * @return {Promise}
 */
function comparePackages(options) {
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
        return {
            success: !tableBody.length,
            output: output,
            text: textTable([].concat(textTableObj.header, tableBody), textTableObj.options)
        };
    })
}

/**
 * packageChecker
 * @param  {Object} options
 * @return {Promise}
 */
function packageChecker(options, callback) {
    var callback = (typeof options === 'object' ? callback : options) || function() {},
        options = objectAssign(SETTINGS, (typeof options === 'object' ? options : callback) || {});

    if (typeof callback !== 'function') {
        throw new Error('Invalid argument: callback');
    }

    Promise.resolve(
        options.hashFile ? CacheToFile.checkHash(options.hashFile, options.path) : {
            success: false
    }).then(function(response) {
        if (!response.success) {
            return comparePackages(options).then(function(compareResponse) {
                return objectAssign(response, compareResponse);
            });
        }
        return response;
    }).then(function(response) {
        if (options.hashFile && response.success) {
            return response.cacheToFile.saveNewHash().then(function() {
                return response;
            });
        }
        return response;
    }).then(function(response) {
        if (response.success) {
            console.log(chalk.green('No differences werre found'));
            callback(null, response);
        } else {
            if (response.text) {
                console.log(response.text);
            }
            if (options.hashFile) {
                response.cacheToFile.removeNewHash();
            }
            throw new Error('Differences were found');
        }
    }).catch(function(err) {
        console.log(chalk.red(err));
        callback(null, response);
    });
}

packageChecker.version = version;

module.exports = packageChecker;
