const fs = require("fs");
const path = require("path");
const logger = require("../../utils/logger");

function resolveAssetPath(assetPath) {
    if (!assetPath) {
        return null;
    }

    const normalizedPath = assetPath.trim();
    const candidates = [];

    if (path.isAbsolute(normalizedPath)) {
        candidates.push(normalizedPath);
    }

    candidates.push(
        path.resolve(
            process.cwd(),
            normalizedPath.replace(/^\/+/, "")
        )
    );

    return candidates.find(fs.existsSync) || candidates[0];
}

function validateMetadata(config) {
    if (!config.metadata) {
        throw new Error("NsisValidator: Missing metadata configuration.");
    }
    if (!config.metadata.applicationId) {
        throw new Error("NsisValidator: metadata.applicationId is required.");
    }
}

function validateAssets(config) {
    const assets = config.assets || {};

    const requiredAssets = ["icon"];
    const optionalAssets = ["license", "sidebarImage", "headerImage"];

    for (const assetName of requiredAssets) {
        const assetPath = assets[assetName];

        if (!assetPath) {
            throw new Error(`NsisValidator: Required asset '${assetName}' is missing.`);
        }

        const resolvedPath = resolveAssetPath(assetPath);

        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`NsisValidator: Required asset '${assetName}' not found: ${resolvedPath}`);
        }

        logger.info(`NsisValidator: Required asset '${assetName}' found: ${resolvedPath}.`);
        assets[assetName] = resolvedPath;
    }

    for (const assetName of optionalAssets) {
        const assetPath = assets[assetName];

        if (!assetPath) {
            continue;
        }

        const resolvedPath = resolveAssetPath(assetPath);

        if (!fs.existsSync(resolvedPath)) {
            logger.warn(`NsisValidator: Optional asset '${assetName}' not found: ${resolvedPath}. Skipping.`);
            assets[assetName] = null;
            continue;
        }

        logger.info(`NsisValidator: Optional asset '${assetName}' found: ${resolvedPath}.`);
        assets[assetName] = resolvedPath;
    }

    config.assets = assets;
}

function validateNsis(config) {
    logger.info("NVAL: Validating NSIS configuration...");
    validateMetadata(config);
    validateAssets(config);
    logger.info("NsisValidator: NSIS configuration validated.");
    return config;
}

module.exports = {
    validateNsis
};