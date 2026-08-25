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
        throw new Error("DmgValidator: Missing metadata configuration.");
    }

    if (!config.metadata.applicationId || !config.metadata.applicationId.trim()) {
        throw new Error("DmgValidator: metadata.applicationId is required.");
    }
}

function validateAssets(config) {
    const assets = config.assets || {};

    // Defined lists for mandatory vs. optional visual/branding assets
    const requiredAssets = [
        // Extend here if any asset becomes strictly mandatory (e.g., "icon")
    ];

    const optionalAssets = [
        "icon",
        "background",
        "license"
    ];

    for (const assetName of requiredAssets) {
        const assetPath = assets[assetName];

        if (!assetPath) {
            throw new Error(`DmgValidator: Required asset '${assetName}' is missing.`);
        }

        const resolvedPath = resolveAssetPath(assetPath);

        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`DmgValidator: Required asset '${assetName}' not found: ${resolvedPath}`);
        }

        logger.info(`DmgValidator: Required asset '${assetName}' found: ${resolvedPath}.`);
        assets[assetName] = resolvedPath;
    }

    for (const assetName of optionalAssets) {
        const assetPath = assets[assetName];

        if (!assetPath) {
            continue;
        }

        const resolvedPath = resolveAssetPath(assetPath);

        if (!fs.existsSync(resolvedPath)) {
            logger.warn(`DmgValidator: Optional asset '${assetName}' not found: ${resolvedPath}. Skipping.`);
            assets[assetName] = null;
            continue;
        }

        logger.info(`DmgValidator: Optional asset '${assetName}' found: ${resolvedPath}.`);
        assets[assetName] = resolvedPath;
    }

    config.assets = assets;
}

function validateLayoutOptions(config) {
    config.window = config.window || {
        width: 600,
        height: 400
    };

    config.iconSize = config.iconSize || 80;

    config.appPosition = config.appPosition || {
        x: 130,
        y: 190
    };

    config.applicationsSymlinkPosition = config.applicationsSymlinkPosition || {
        x: 410,
        y: 190
    };
}

function validateDmg(config) {
    logger.info("DVAL: Validating DMG configuration...");
    validateMetadata(config);
    validateAssets(config);
    validateLayoutOptions(config);
    logger.info("DmgValidator: DMG configuration validated.");
    return config;
}

module.exports = {
    validateDmg
};