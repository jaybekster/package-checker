'use strict';

var child = require('child_process');

/**
 * Gets actual version of packages via running <npm list> command
 * @param  {Object} options
 * @return {Promise}
 */
function getCurrentNpmLs(options) {
    return new Promise(function(resolve, reject) {
        var npm = child.spawn('npm',
            ['list', '--depth=0', '--json', options.prod ? '--prod' : '', options.dev ? '--dev' : ''],
            { cwd: options.directory }
        );
        var stdoutCollector = '';
        var stderrCollector = ''

        npm.stdout.on('data', function(chunk) {
            stdoutCollector += chunk;
        });

        npm.stderr.on('data', function(chunk) {
            stderrCollector += chunk;
        });

        npm.on('error', function(error) {
            reject(error);
        })

        npm.on('close', function(code) {
            try {
                var parsedData = JSON.parse(stdoutCollector);
                resolve(parsedData.dependencies);
            } catch (err) {
                if (code !== 0) {
                    reject(stderrCollector);
                    return;
                }

                reject(err);
            }
        });
    });
}

module.exports = getCurrentNpmLs;
