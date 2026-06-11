#!/usr/bin/env node

const logger = require("./utils/logger");
const resolveConfig = require("./lib/configresolver");

const args = process.argv.slice(2);
const separatorIndex = args.indexOf('--');
const passedFlags = separatorIndex !== -1 ? args.slice(0, separatorIndex) : args;
const neuBuildFlags = separatorIndex !== -1 ? args.slice(separatorIndex + 1) : [];
const target = passedFlags.find(arg => !arg.startsWith('-'));

logger.info("Neutralinojs Builder initialized.");

const config = resolveConfig();
config.neuBuildFlags = neuBuildFlags;

logger.info("Configuration loaded.");

if (!target) {
    logger.warn("No target specified. Usage: neu-builder <target> -- [neu build flags]");
} else {
    logger.info(`Target detected: ${target}`);
    if (neuBuildFlags.length > 0) {
        logger.info(`Neu build flags detected: ${neuBuildFlags.join(' ')}`);
    }
}