var fs = require('fs');

/**
 * readPackageJson read packages and version from package.json file
 * @param  {Object} options
 * @return {Promise}
 */
function readPackageJson(options) {
    return new Promise(function(resolve, reject) {
        if (fs.existsSync(options.path) && fs.statSync(options.path).isFile()) {
            fs.readFile(options.path, 'utf8', function(err, date) {
                if (err) {
                    throw new Error(err);
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
        }
    });
}

module.exports = readPackageJson;
