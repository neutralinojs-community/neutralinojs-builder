
const logger = require("./utils/logger");
const resolveConfig = require("./lib/configresolver");

const args = process.argv.slice(2);

const target = args[0];

logger.info("Neutralinojs Builder initialized.");

const config = resolveConfig();

logger.info("Configuration loaded.");

console.log(config);

if (!target) {

    logger.warn(
        "No target specified. Usage: neu-builder <target>"
    );

}
else {

    logger.info(`Target detected: ${target}`);

}