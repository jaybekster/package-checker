'use strict';

var fs = require('fs'),
    crypto = require('crypto');

function getSumOfFile(path) {
    return new Promise(function(resolve, reject) {
        fs.readFile(path, 'utf8', function(error, data) {
            if (error) {
                reject(error);
                return;
            }
            var md5sum = crypto
                .createHash('md5')
                .update(data)
                .digest('hex');
            resolve(md5sum);
        });
    });
}

function createSumFile(path, filename) {
    return new Promise(function(resolve, reject) {
        getSumOfFile(path).then(function(md5sum) {
            fs.writeFile(filename, md5sum, function(err) {
                if (err) {
                    reject(err);
                }
                resolve(md5sum);
            });
        });
    });
}

function readSumOfFile(sumFile) {
    return new Promise(function(resolve, reject) {
        fs.stat(sumFile, function(error, stats) {
            if (error) {
                resolve(null);
                return;
            }
            fs.readFile(sumFile, 'utf8', function(error, data) {
                console.log(data);
                if (error) {
                    reject(error);
                    return;
                }
                resolve(data);
            });
        });
    });
}

function cacheToFile(path, filename) {
    return Promise.all([
        readSumOfFile(filename).then(function(md5sum) {
            if (md5sum === null) {
                return createSumFile(path, filename).then(function(md5sum) {
                    return null;
                });
            } else {
                return md5sum;
            }
        }),
        getSumOfFile(path)
    ]).then(function(results) {
        var saveHashSum = results[0],
            fileHashSum = results[1];
            console.log(results);
        if (saveHashSum === fileHashSum) {
            return true;
        } else {
            return false;
        }
    });
}

module.exports = cacheToFile;
