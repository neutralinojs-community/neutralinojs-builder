const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

let detectBuildType = (projectPath, resolvedConfig) => {
    const distDir = path.join(projectPath, 'dist');

    if (!fs.existsSync(distDir)) {
        logger.warn("BuildInvoker: dist/ directory does not exist. Defaulting buildType to 'sea'.");
        return 'sea';
    }

    const binaryName = resolvedConfig.metadata?.binaryName;
    const appName = resolvedConfig.metadata?.applicationName;

    // Build ordered list: binaryName folder first, then appName folder
    const targetFolders = [
        binaryName ? path.join(distDir, binaryName) : null,
        appName ? path.join(distDir, appName) : null
    ].filter(Boolean);

    logger.info(`BuildInvoker: Checking target application folders in dist/: ${targetFolders.join(', ')}`);

    for (const folder of targetFolders) {
        if (fs.existsSync(folder)) {
            const resourcesPath = path.join(folder, 'resources.neu');
            if (fs.existsSync(resourcesPath)) {
                logger.info(`BuildInvoker: Found 'resources.neu' in '${folder}'. Detected buildType: 'standard'.`);
                return 'standard';
            }
            logger.info(`BuildInvoker: 'resources.neu' not found in '${folder}'.`);
        } else {
            logger.info(`BuildInvoker: Target folder '${folder}' does not exist.`);
        }
    }

    logger.info("BuildInvoker: No 'resources.neu' found in designated app folders. Detected buildType: 'sea'.");
    return 'sea';
};

let prepare = (resolvedConfig) => {
    const projectPath = process.cwd();
    const buildType = detectBuildType(projectPath, resolvedConfig);
    logger.info(`Build type detected: ${buildType}`);
    resolvedConfig.buildType = buildType;
    return resolvedConfig;
};

module.exports = {
    detectBuildType,
    prepare
};