'use strict';

var EventEmitter = require('events').EventEmitter,
    semver = require('semver'),
    textTable = require('text-table'),
    chalk = require('chalk'),
    CacheToFile = require('./cache-to-file.js'),
    readPackageJson = require('./read-package-json'),
    getCurrentNpmLs = require('./get-current-npm-ls');

var textTableObj = {
    header: [
        ['Name', 'Current', 'Wanted', 'Problem']
    ],
    options: {
        align: ['l', 'l', 'l', 'l']
    }
};

function PackageChecker(settings, callback) {
    // this.options = Object.(SETTINGS, (typeof options === 'object' ? options : callback) || {});
    // потом удалить
    settings.hashFile = './hash';

    if (settings.hashFile) {
        this.cacheToFile =  new CacheToFile(settings.hashFile, settings.path)
    }
    this.settings = settings;
    this.emitter = new EventEmitter();
    this.currentPackages = null;
    this.actualPackages = null;
}

PackageChecker.prototype.regexps = {
    github: /^https:\/\/github.com\/([^\/])+\/([^\/]+\.git)#([0-9]+\.[0-9]+\.[0-9]+)$/
};

PackageChecker.prototype.setEmitterHandlers = function() {
    this.emitter.on('packageList', function(data) {
        this.currentPackages = data;
    }.bind(this));

    this.emitter.on('npmList', function(data) {
        this.actualPackages = data;
    }.bind(this));

    ['packageList', 'npmList'].forEach(function(eventName) {
        this.emitter.on(eventName, function(data) {
            if (this.currentPackages && this.actualPackages) {
                this.analyze();
            }
        }.bind(this))
    }.bind(this));
}

PackageChecker.prototype.check = function() {
    if (this.settings.hashFile) {
        CacheToFile.checkHash(this.settings.hashFile, this.settings.path).then(function(result) {
            if (result.success) {
                console.log(chalk.gray('Hash hasn\'t been changed'));
            } else {
                this.setEmitterHandlers();
            }
        });
    }

    this.setEmitterHandlers();

    readPackageJson(this.settings).then(function(data) {
        this.emitter.emit('packageList', data);
    }.bind(this));

    getCurrentNpmLs(this.settings).then(function(data) {
        this.emitter.emit('npmList', data);
    }.bind(this));
};

PackageChecker.prototype.analyze = function() {
    var result = this.compare();

    if (result.success) {
        if (this.settings.hashFile) {
            this.cacheToFile.saveNewHash();
        }
        console.log(chalk.green('No differences were found'));
    } else {
        if (response.text) {
            console.log(response.text);
        }
        console.log('Differences were found');
    }
    return result;
}

PackageChecker.prototype.compare = function() {
    var currentPackages = this.currentPackages,
        actualPackages = this.actualPackages,
        gitHubPublicRe = this.regexps.github,
        packageName,
        packageVersion,
        tableBody = [],
        packageJsonVersion,
        output = {};

    if (!(currentPackages && actualPackages)) {
        return false;
    }
    for (packageName in actualPackages) {
        output[packageName] = {};
        output[packageName].actualVersion = actualPackages[packageName];

        if (!currentPackages[packageName] || currentPackages[packageName].missing) {
            tableBody.push([packageName, '', actualPackages[packageName], 'is missing']);
            continue;
        }

        packageJsonVersion = actualPackages[packageName];
        if (currentPackages[packageName].version) {
            packageVersion = currentPackages[packageName].version;
        } else if (currentPackages[packageName].required && currentPackages[packageName].required.version) {
            packageVersion = currentPackages[packageName].required.version;
        }

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
}

module.exports = PackageChecker;

