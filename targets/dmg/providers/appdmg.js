const appdmg = require("appdmg");

function createPackage(options) {
    return new Promise((resolve, reject) => {
        const ee = appdmg({
            target: options.target,
            basepath: options.basepath,
            specification: options.specification
        });

        ee.on("finish", () => {
            resolve(options.target);
        });

        ee.on("error", (err) => {
            reject(err);
        });
    });
}

module.exports = {
    createPackage
};