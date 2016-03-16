'use strict';

var fs = require('fs'),
    objectAssign = require('object-assign');

/**
 * readPackageJson read packages and version from package.json file
 * @param  {Object} options
 * @return {Promise}
 */
function readPackageJson(options) {
    return new Promise(function(resolve, reject) {
        fs.readFile(options.path, 'utf8', function(error, data) {
            if (error) {
                reject(error);
                return;
            }
            var packageJSON = JSON.parse(data);
            var pakageDeps = {};
            if (options.dev && packageJSON.devDependencies) {
                pakageDeps = objectAssign(pakageDeps, packageJSON.devDependencies);
            }
            if (options.prod && packageJSON.dependencies) {
                pakageDeps = objectAssign(pakageDeps, packageJSON.dependencies);
            }
            resolve(pakageDeps);
        });
    });
}

module.exports = readPackageJson;
