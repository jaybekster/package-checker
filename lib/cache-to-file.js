'use strict';

var fs = require('fs'),
    crypto = require('crypto');

/**
 * @param  {string} savedHashPath path from where previous hash should be read
 * @param  {string} newHashPath path for what file generate hash from
 * @return {cacheToFile} instance
 */
var CacheToFile = function(savedHashPath, newHashPath) {
    this.savedHashPath = savedHashPath;
    this.newHashPath = newHashPath;
    this.generatedHash = null;
};

CacheToFile.prototype = {
    /**
     * Reads hash from file saved to contain hash
     * @param  {string} path to a file containing saved hash
     * @return {Promise}
     */
    readSavedHash: function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            fs.stat(self.savedHashPath, function(error, stats) {
                if (error) {
                    resolve(null);
                    return;
                }
                fs.readFile(self.savedHashPath, 'utf8', function(error, fileData) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(fileData);
                });
            });
        });
    },

    /**
     * Gets new hash from file
     * @param  {string} path to a file to generate new hash
     * @return {Promise}
     */
    getNewHash: function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            fs.readFile(self.newHashPath, 'utf8', function(error, fileData) {
                if (error) {
                    reject(error);
                    return;
                }

                var md5sum = crypto
                    .createHash('md5')
                    .update(fileData)
                    .digest('hex');
                self.generatedHash = md5sum;
                resolve(md5sum);
            });
        });
    },

    saveNewHash: function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            fs.writeFile(self.savedHashPath, self.generatedHash, function(error) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(true);
            });
        });
    },

    removeNewHash: function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            fs.unlink(self.savedHashPath, function(data) {
                resolve(data);
            });
        });
    }
}

CacheToFile.checkHash = function(savedHashPath, newHashPath) {
    var cacheToFile = new CacheToFile(savedHashPath, newHashPath);
    return Promise.all([
        cacheToFile.readSavedHash(),
        cacheToFile.getNewHash()
    ]).then(function(values) {
        var savedHash = values[0],
            newHash = values[1];

        return {
            savedHash: savedHash,
            newHash: newHash,
            cacheToFile: cacheToFile,
            success: savedHash === newHash
        };
    });
}

module.exports = CacheToFile;
