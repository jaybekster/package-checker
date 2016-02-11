var child = require('child_process');

/**
 * getCurrentNpmLs get actual version of packages via running npm list command
 * @param  {Object} options
 * @return {Promise}
 */
function getCurrentNpmLs(options) {
    return new Promise(function(resolve, reject) {
        child.exec('npm list --depth=0 --json' +
            (options.prod ? ' --prod' : '') +
            (options.dev ? ' --dev' : ''), {
                cwd: options.directory
            }, function(error, stdout, stderr) {
            var curDeps = JSON.parse(stdout).dependencies;
            resolve(curDeps);
        });
    });
}

module.exports = getCurrentNpmLs;
