const logger = require("../../utils/logger");
const buildPackage = require("./packagebuilder");
const { validateDmg } = require("./dmgvalidator");

async function build(config, stagingPath) {
    let packagePath;
    try {
        logger.info("DMG: Starting DMG packaging...");
        validateDmg(config);
        packagePath = await buildPackage(config, stagingPath);
        logger.info(`DMG: Generated package: ${packagePath}`);
    } catch (error) {
        console.error(error);
        throw error;
    }

    return packagePath;
}

module.exports = {
    build,
};