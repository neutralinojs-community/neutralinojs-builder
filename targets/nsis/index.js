const logger = require("../../utils/logger");
const { validateNsis } = require("./nsisvalidator");
const { buildPackage } = require("./packagebuilder");

async function build(config, stagingPath) {
    let packagePath;
    try {
        logger.info("NSIS: Starting NSIS packaging...");
        validateNsis(config);
        packagePath = await buildPackage(config, stagingPath);
        logger.info(`NSIS: Generated installer: ${packagePath}`);
    } catch (error) {
        console.error(error);
        throw error;
    }
    return packagePath;
}

module.exports = {
    build
};