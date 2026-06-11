const logger = require("../utils/logger");
const targets = require("../constants/targets");
const { spawnSync } = require("child_process");

function validateTools(target) {

    target.requiredTools.forEach((tool) => {
        const result = spawnSync(
            tool,
            ["--version"],
            { stdio: "ignore" }
        );

        if (result.error) {
            logger.error(`Required tool '${tool}' not found.`);
            throw new Error(
                `Required tool '${tool}' not found.`
            );
        }
        logger.info(`Found required tool: ${tool}`);

    });

}

function validateArchitecture(config, target) {
    if (!target.supportedArchitectures.includes(config.arch)) {
        logger.error(`Unsupported architecture: ${config.arch}`);
        throw new Error(`Architecture '${config.arch}' is not supported for ${config.target}.`);

    }
}

function validateHost(config, target) {
    if (!target.supportedHosts.includes(config.hostPlatform)) {
        logger.error(`${config.target} is not supported on ${config.hostPlatform}.`);
        throw new Error(`${config.target} is not supported on ${config.hostPlatform}.`);
    }
}

const rules = {

    deb(config, target) {

        logger.info("Running DEB pre-checks...");

        validateHost(config, target);
        validateArchitecture(config, target);
        validateTools(target);

    },

    appimage(config, target) {

        logger.info("Running AppImage pre-checks...");

        validateHost(config, target);
        validateArchitecture(config, target);
        validateTools(target);

    },

    nsis(config, target) {

        logger.info("Running NSIS pre-checks...");

        validateHost(config, target);
        validateArchitecture(config, target);
        validateTools(target);

    },

    dmg(config, target) {

        logger.info("Running DMG pre-checks...");

        validateHost(config, target);
        validateArchitecture(config, target);
        validateTools(target);
    }

};

function precheck(config) {

    logger.info(`Running dependency pre-checks for '${config.target}'...`);

    const target = targets[config.target];

    if (!target) {
        logger.error(`Unsupported target: ${config.target}`);

        throw new Error(`Unsupported target: ${config.target}`);
    }

    const precheckRule = rules[config.target];

    if (precheckRule) {
        precheckRule(config, target);
    }

    logger.info("Dependency pre-checks passed.");

    return true;

}

module.exports = precheck;