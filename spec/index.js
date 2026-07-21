const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');

const mocha = new Mocha();

const testDir = __dirname;

const specModule =
    process.argv.length > 2
        ? process.argv[2]
        : '';

function addSpecFiles(directory) {
    fs.readdirSync(directory, { withFileTypes: true })
        .forEach((entry) => {
            const fullPath =
                path.join(directory, entry.name);

            if (entry.isDirectory()) {
                addSpecFiles(fullPath);
                return;
            }

            if (!entry.name.includes(specModule + '.spec.js')) {
                return;
            }

            mocha.addFile(
                fullPath
            );
        });
}

addSpecFiles(testDir);

mocha.timeout(50000);

mocha.run((failures) => {
    process.exitCode =
        failures ? 1 : 0;
});
