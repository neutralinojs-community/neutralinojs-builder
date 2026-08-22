const logger = require("../utils/logger");
const resolveConfig = require("./configresolver");
const precheck = require("./precheck");
const buildinvoker = require("./buildinvoker");
const stagingManager = require("./stagingmanager");
const targetLoader = require("./targetloader");

async function build(target, arch, neuBuildFlags) {
    logger.info("Starting build pipeline...");

    let stagingPath;
    try {
        // Pass arch as args[1] — configresolver expects [target, --arch]
        const resolverArgs = arch ? [target, `--${arch}`] : [target];
        let config = resolveConfig(resolverArgs);

        // [ARCH-DEBUG] Log arch immediately after config is resolved
        console.log(`[ARCH-DEBUG] builder: config.arch after resolveConfig = ${JSON.stringify(config.arch)}`);

        config.target = target;
        config.neuBuildFlags = neuBuildFlags;

        config = buildinvoker.prepare(config);

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