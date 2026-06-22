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

        candidates.push(
            path.resolve(
                process.cwd(),
                normalizedPath.replace(/^\/+/, "")
            )
        );
    } else {
        candidates.push(
            path.resolve(
                process.cwd(),
                normalizedPath
            )
        );
    }

    return candidates.find(fs.existsSync) || candidates[0];
}

function validateMetadata(config) {

    if (!config.metadata) {
        throw new Error("DebValidator: Missing metadata configuration.");
    }

    if (!config.metadata.applicationId) {
        throw new Error("DebValidator: metadata.applicationId is required.");
    }
}
function validateAssets(config) {

    const assets = config.assets || {};

    const requiredAssets = [
        // future required assets
    ];

    const optionalAssets = [
        "icon",
        "license"
    ];

    for (const assetName of requiredAssets) {

        const assetPath =
            assets[assetName];

        if (!assetPath) {
            throw new Error(`DebValidator: Required asset '${assetName}' is missing.`);
        }

        const resolvedPath =
            resolveAssetPath(assetPath);

        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`DebValidator: Required asset '${assetName}' not found: ${resolvedPath}`);
        }
        logger.info(`DebValidator: Required asset '${assetName}' found: ${resolvedPath}.`);

        assets[assetName] = resolvedPath;
    }

    for (const assetName of optionalAssets) {

        const assetPath = assets[assetName];

        if (!assetPath) {
            continue;
        }

        const resolvedPath = resolveAssetPath(assetPath);

        if (!fs.existsSync(resolvedPath)) {
            logger.warn(`DebValidator: Optional asset '${assetName}' not found: ${resolvedPath}. Skipping.`);

            assets[assetName] = null;
            continue;
        }
        logger.info(`DebValidator: Optional asset '${assetName}' found: ${resolvedPath}.`);

        assets[assetName] = resolvedPath;
    }

    config.assets = assets;
}

function validateDeb(config) {

    logger.info("DVAL: Validating DEB configuration...");
    validateMetadata(config);
    validateAssets(config);
    logger.info("DebValidator: DEB configuration validated.");
    return config;
}

module.exports = {
    validateDeb
};