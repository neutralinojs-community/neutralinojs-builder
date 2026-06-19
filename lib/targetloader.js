const path = require("path");
const logger = require("../utils/logger");

function load(targetName) {
    try {
        const targetPath = path.join(
            __dirname,
            "../targets",
            targetName,
            "index.js"
        );
        logger.info(`Loading target: ${targetName}`);
        return require(targetPath);
    } catch (err) {
        logger.error(`Target '${targetName}' not found.`);
        throw new Error(`Target '${targetName}' not found.`);
    }
}

module.exports = { load };