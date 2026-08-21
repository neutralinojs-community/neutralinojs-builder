const logger = require("../../utils/logger");
const buildPackage = require("./packagebuilder");
const { validateAppImage } = require("./appimagevalidator");

async function build(config, stagingPath) {
    try {
        logger.info("AppImage: Starting packaging pipeline...");
        validateAppImage(config);
        const packagePath = await buildPackage(config, stagingPath);
        logger.info(`AppImage: Output created at ${packagePath}`);
        return packagePath;
    } catch (error) {
        logger.error(`AppImage build failed: ${error.message}`);
        throw error;
    }
}

module.exports = { build };