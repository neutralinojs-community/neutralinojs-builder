#!/usr/bin/env node

const logger = require("./utils/logger");
const builder = require("./lib/builder");

const args = process.argv.slice(2);
const separatorIndex = args.indexOf('--');
const passedFlags = separatorIndex !== -1 ? args.slice(0, separatorIndex) : args;
const neuBuildFlags = separatorIndex !== -1 ? args.slice(separatorIndex + 1) : [];
const target = passedFlags.find(arg => !arg.startsWith('-'));

logger.info("Configuration loaded.");
logger.info(config);
logger.info("Neutralinojs Builder initialized.");

if (!target) {
    logger.warn("No target specified. Usage: neu-builder <target> -- [neu build flags]");
    process.exit(1);
} else {
    logger.info(`Target detected: ${target}`);
    if (neuBuildFlags.length > 0) {
        logger.info(`Forwarding core build flags: ${neuBuildFlags.join(' ')}`);
    }
    builder.build(target, neuBuildFlags).catch(() => {
        process.exit(1);
    });
}