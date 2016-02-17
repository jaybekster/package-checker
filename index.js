'use strict';

var semver = require('semver'),
    prcoess = require('process'),
    textTable = require('text-table'),
    chalk = require('chalk'),
    version = require('./package.json').version,
    readPackageJson = require('./lib/read-package-json'),
    getCurrentNpmLs = require('./lib/get-current-npm-ls');

const textTableObj = {
    header: [
        ['Name', 'Current', 'Wanted', 'Problem']
    ],
    options: {
        align: ['l', 'l', 'l', 'l']
    }
};

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
        error = null,
        output = {};

    return Promise.all([
        readPackageJson(options),
        getCurrentNpmLs(options)
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
            callback(null, output);
            console.log(chalk.green('No differences were found'));
        }
    }).catch(function(error) {
        console.log(chalk.red(error));
        callback(error, output);
    });
}

packageChecker.version = version;

module.exports = packageChecker;
