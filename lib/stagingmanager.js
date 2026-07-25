const path = require("path");
const fs = require("fs");
const fileUtils = require("../utils/fileutils");
const logger = require("../utils/logger");

function findAppDistDir(distDir) {
    const entries = fs.readdirSync(distDir, { withFileTypes: true });
    const appDirs = entries.filter((entry) => {
        if (!entry.isDirectory()) {
            return false;
        }
        const candidatePath = path.join(distDir, entry.name);
        return fs.existsSync(path.join(candidatePath, "resources.neu"));
    });

    if (appDirs.length === 0) {
        throw new Error("No application output folder found in dist/. Run neu build first.");
    }

    if (appDirs.length > 1) {
        throw new Error(
            `Multiple application folders found in dist/: ${appDirs.map((d) => d.name).join(", ")}. Unable to determine which one to package.`
        );
    }

    return path.join(distDir, appDirs[0].name);
}

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

    const appDistDir = findAppDistDir(distDir);

    const files = fs.readdirSync(appDistDir);
    const candidateFiles = files.filter((file) => {
        const fullPath = path.join(appDistDir, file);
        return (fs.statSync(fullPath).isFile() && file !== "resources.neu");
    });

    const arch = config.arch || "x64";
    const platformKey = config.targetPlatform === "windows" ? "win" : config.targetPlatform;
    const archSuffix = `-${platformKey}_${arch}`;

    const binaries = candidateFiles.filter((file) =>
        file.includes(archSuffix)
    );

    if (binaries.length === 0) {
        throw new Error(
            `Unable to locate Neutralino binary for platform '${config.targetPlatform}' arch '${arch}' in dist/. Found: ${candidateFiles.join(", ") || "none"}`
        );
    }

    if (binaries.length > 1) {
        throw new Error(`Multiple binaries matched '${archSuffix}': ${binaries.join(", ")}`);
    }

    const binaryFile = binaries[0];
    config.metadata.resolvedBinaryName = binaryFile;

    fileUtils.copyFile(
        path.join(appDistDir, binaryFile),
        path.join(stagingDir, binaryFile)
    );

    if (config.buildType !== "sea") {
        const resourcesFile = path.join(appDistDir, "resources.neu");
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