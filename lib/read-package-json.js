var fs = require('fs');

/**
 * readPackageJson read packages and version from package.json file
 * @param  {Object} options
 * @return {Promise}
 */
function readPackageJson(options) {
    return new Promise(function(resolve, reject) {
        fs.readFile(options.path, 'utf8', function(err, date) {
            if (err) {
                throw err;
            }
            var packageJSON = JSON.parse(date);
            var pakageDeps = {};
            if (options.dev && packageJSON.devDependencies) {
                pakageDeps = Object.assign(pakageDeps, packageJSON.devDependencies);
            }
            if (options.prod && packageJSON.dependencies) {
                pakageDeps = Object.assign(pakageDeps, packageJSON.dependencies);
            }
            resolve(pakageDeps);
        });
    });
}

module.exports = readPackageJson;
