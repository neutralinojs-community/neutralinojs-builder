const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

let detectBuildType = (projectPath) => {
    const resourcesPath = path.join(projectPath, 'resources.neu');
    return fs.existsSync(resourcesPath) ? 'standard' : 'sea';
};

let prepare = (resolvedConfig) => {
    const projectPath = process.cwd();
    const buildType = detectBuildType(projectPath);
    logger.info(`Build type detected: ${buildType}`);
    resolvedConfig.buildType = buildType;
    return resolvedConfig;
};

module.exports = {
    detectBuildType,
    prepare
};