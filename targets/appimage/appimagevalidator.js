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
        throw new Error("AppImageValidator: Missing metadata configuration.");
    }

    if (!config.metadata.applicationId || !config.metadata.applicationId.trim()) {
        throw new Error("AppImageValidator: metadata.applicationId is required.");
    }
}

function validateAssets(config) {
    const assets = config.assets || {};

    // Mandatory assets required for AppImage
    const requiredAssets = [
        "icon"
    ];

    // Optional assets that will be skipped with a warning if missing
    const optionalAssets = [
        "license"
    ];

    for (const assetName of requiredAssets) {
        const assetPath = assets[assetName];

        if (!assetPath) {
            throw new Error(`AppImageValidator: Required asset '${assetName}' is missing.`);
        }

        const resolvedPath = resolveAssetPath(assetPath);

        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`AppImageValidator: Required asset '${assetName}' not found: ${resolvedPath}`);
        }
        logger.info(`AppImageValidator: Required asset '${assetName}' found: ${resolvedPath}.`);

        assets[assetName] = resolvedPath;
    }

    for (const assetName of optionalAssets) {
        const assetPath = assets[assetName];

        if (!assetPath) {
            continue;
        }

        const resolvedPath = resolveAssetPath(assetPath);

        if (!fs.existsSync(resolvedPath)) {
            logger.warn(`AppImageValidator: Optional asset '${assetName}' not found: ${resolvedPath}. Skipping.`);
            assets[assetName] = null;
            continue;
        }
        logger.info(`AppImageValidator: Optional asset '${assetName}' found: ${resolvedPath}.`);

        assets[assetName] = resolvedPath;
    }

    config.assets = assets;
}

function validateAppImage(config) {
    logger.info("AppImageValidator: Validating AppImage configuration...");
    validateMetadata(config);
    validateAssets(config);
    logger.info("AppImageValidator: AppImage configuration validated.");
    return config;
}

module.exports = {
    validateAppImage
};