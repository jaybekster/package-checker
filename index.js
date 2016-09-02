'use strict';

var objectAssign = require('object-assign'),
    chalk = require('chalk'),
    version = require('./package.json').version,
    CacheToFile = require('./lib/cache-to-file.js'),
    readPackageJson = require('./lib/read-package-json'),
    comparePackages = require('./lib/compare-packages'),
    getCurrentNpmLs = require('./lib/get-current-npm-ls');

var SETTINGS = {
    path: process.cwd() + '/package.json',
    directory: process.cwd(),
    prod: true,
    dev: true,
    hashFile: false
};

/**
 * @param  {Object} options
 * @param  {Function} callback
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
        }
    ).then(function(response) {
        if (!response.success) {
            return Promise.all([
                readPackageJson(options),
                getCurrentNpmLs(options)
            ]).then(function(values) {
                return comparePackages({
                    currentPackages: values[1],
                    actualPackages: values[0]
                });
            }).then(function(compareResponse) {
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
            console.log(chalk.green('No differences were found'));
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
        return response;
    }).catch(function(err) {
        console.log(chalk.red(err));
        callback(null, response);
    });
}

packageChecker.version = version;

module.exports = packageChecker;
