const path = require("path");
const fs = require("fs");
const fileUtils = require("../utils/fileutils");
const logger = require("../utils/logger");

function prepare(config) {
    const stagingDir = path.join(
        process.cwd(),
        ".neu-builder-staging"
    );

    logger.info("Preparing staging directory...");
    fileUtils.removeDirectory(stagingDir);
    fileUtils.ensureDirectory(stagingDir);

    const distDir = path.join(process.cwd(), "dist");

    if (!fs.existsSync(distDir)) {
        logger.error("dist/ directory not found. Run neu build first.");
        throw new Error("dist/ directory not found.");
    }

    const files = fs.readdirSync(distDir);
    const binaries = files.filter((file) => {
        const fullPath = path.join(distDir, file);
        return (fs.statSync(fullPath).isFile() && file !== "resources.neu");
    });

    if (binaries.length === 0) {
        throw new Error("Unable to locate Neutralino binary in dist/");
    }

    if (binaries.length > 1) {
        throw new Error(`Multiple binaries found in dist/: ${binaries.join(", ")}`);
    }

    const binaryFile = binaries[0];

    fileUtils.copyFile(
        path.join(distDir, binaryFile),
        path.join(stagingDir, binaryFile)
    );

    if (config.buildType !== "sea") {
        const resourcesFile = path.join(distDir, "resources.neu");
        if (!fs.existsSync(resourcesFile)) {
            throw new Error("resources.neu not found in dist/");
        }

        fileUtils.copyFile(resourcesFile, path.join(stagingDir, "resources.neu"));
    }

    logger.info(`Staging ready at: ${stagingDir}`);
    return stagingDir;
}

function cleanup(stagingDir) {
    fileUtils.removeDirectory(stagingDir);
    logger.info("Staging directory cleaned up.");
}

module.exports = {
    prepare,
    cleanup
};