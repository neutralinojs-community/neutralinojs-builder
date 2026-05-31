const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');

const mocha = new Mocha();

const testDir = __dirname;

const specModule =
    process.argv.length > 2
        ? process.argv[2]
        : '';

fs.readdirSync(testDir)
    .filter((file) =>
        file.includes(specModule + '.spec.js')
    )
    .forEach((file) => {
        mocha.addFile(
            path.join(testDir, file)
        );
    });

mocha.timeout(50000);

mocha.run((failures) => {
    process.exitCode =
        failures ? 1 : 0;
});