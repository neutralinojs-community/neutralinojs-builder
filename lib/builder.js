const logger = require("../utils/logger");
const resolveConfig = require("./configresolver");
const precheck = require("./precheck");
const stagingManager = require("./stagingmanager");
const targetLoader = require("./targetloader");

async function build(target, neuBuildFlags) {
    logger.info("Starting build pipeline...");

    let stagingPath;
    try {
        const config = resolveConfig();

        config.target = target;
        config.neuBuildFlags = neuBuildFlags;

        logger.info("Configuration loaded.");

        precheck(config);
        logger.info("Environment pre-checks passed.");

        stagingPath = stagingManager.prepare(config);
        logger.info("Staging folder prepared successfully.");

        const targetModule = targetLoader.load(config.target);
        logger.info(`Target loaded: ${config.target}`);

        await targetModule.build(config, stagingPath);
        logger.info("Packaging completed successfully!");
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        if (stagingPath) {
            stagingManager.cleanup(stagingPath);
        }
    }
}

module.exports = { build };