const logger = require("../../utils/logger");

const buildPackage = require("./packagebuilder");

const {
    prepareDebLayout,
    validateDebLayout,
} = require("./staginglayout");

const {
    validateDeb
} = require("./debvalidator");

async function build(config, stagingPath) {
    let packagePath;
    try {
        logger.info("DEB: Starting DEB packaging...");
        validateDeb(config);
        prepareDebLayout(config, stagingPath);
        validateDebLayout(config, stagingPath);
        packagePath = await buildPackage(config, stagingPath);
        logger.info(`DEB: Generated package: ${packagePath}`);
    } catch (error) {
        console.error(error);
        throw error
    }

    return packagePath;
}

module.exports = {
    build,
};