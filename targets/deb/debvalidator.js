const fs = require("fs");
const path = require("path");
const logger = require("../../utils/logger");

function resolveAssetPath(assetPath) {
    if (!assetPath) {
        return null;
    }

    if (typeof assetPath !== "string") {
        throw new Error("DebValidator: Asset paths must be strings.");
    }

    const normalizedPath = assetPath.trim();

    if (!normalizedPath) {
        return null;
    }

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

    if (
        typeof config.metadata.applicationId !== "string" ||
        !config.metadata.applicationId.trim()
    ) {
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

function validateMaintainerScripts(config) {

    const scripts = config.maintainerScripts || {};

    const optionalScripts = [
        "preinst",
        "postinst",
        "prerm",
        "postrm"
    ];

    for (const scriptName of optionalScripts) {

        const scriptPath = scripts[scriptName];

        if (!scriptPath) {
            continue;
        }

        const resolvedPath = resolveAssetPath(scriptPath);

        if (!fs.existsSync(resolvedPath)) {
            logger.warn(`DebValidator: Optional maintainer script '${scriptName}' not found: ${resolvedPath}. Skipping.`);
            scripts[scriptName] = null;
            continue;
        }
        logger.info(`DebValidator: Optional maintainer script '${scriptName}' found: ${resolvedPath}.`);
        scripts[scriptName] = resolvedPath;
    }

    config.maintainerScripts = scripts;
}


function validateDeb(config) {
    if (!config || typeof config !== "object") {
        throw new Error("DebValidator: Missing DEB configuration.");
    }

    logger.info("DVAL: Validating DEB configuration...");
    validateMetadata(config);
    validateAssets(config);
    validateMaintainerScripts(config);
    logger.info("DebValidator: DEB configuration validated.");
    return config;
}

module.exports = {
    validateDeb
};
