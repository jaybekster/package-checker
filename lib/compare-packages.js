'use strict';

var semver = require('semver'),
	textTable = require('text-table');

var gitHubPublicRe = /^https:\/\/github.com\/([^\/])+\/([^\/]+\.git)#([0-9]+\.[0-9]+\.[0-9]+)$/,
	textTableObj = {
	    header: [
	        ['Name', 'Current', 'Wanted', 'Problem']
	    ],
	    options: {
	        align: ['l', 'l', 'l', 'l']
	    }
	};

/**
 * Compare data from `npm list` command and `package.json`
 * @param  {Object} data
 * @return {Object}
 */
function comparePackages(data) {
	var packageName,
		output = {},
	    currentPackages = data.currentPackages,
	    actualPackages = data.actualPackages,
	    packageVersion,
	    tableBody = [],
	    packageJsonVersion;

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

module.exports = comparePackages;
