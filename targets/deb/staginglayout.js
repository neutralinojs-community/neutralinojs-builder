const fs = require("fs");
const path = require("path");

function prepareDebLayout(config, stagingPath) {
    const metadata = config.metadata || {};

    const files = fs.readdirSync(stagingPath);

    const binaryFile = files.find((file) => {
        if (file === "resources.neu") {
            return false;
        }

        const fullPath = path.join(stagingPath, file);
        return fs.statSync(fullPath).isFile();
    });

    if (!binaryFile) {
        throw new Error("StagingLayout: Unable to locate Neutralino binary.");
    }

    // Keep original filename
    metadata.resolvedBinaryName = binaryFile;
    config.metadata = metadata;

    return binaryFile;
}

function validateDebLayout(config, stagingPath) {
    if (!fs.existsSync(stagingPath)) {
        throw new Error("StagingLayout: Invalid staging directory");
    }

    const files = fs.readdirSync(stagingPath);

    const hasBinary = files.some((file) => {
        if (file === "resources.neu") {
            return false;
        }

        return fs.statSync(
            path.join(stagingPath, file)
        ).isFile();
    });

    if (!hasBinary) {
        throw new Error("StagingLayout: Missing application binary.");
    }

    if (
        config.buildType !== "sea" &&
        !files.includes("resources.neu")
    ) {
        throw new Error(
            "StagingLayout: Missing resources.neu."
        );
    }
}

module.exports = {
    prepareDebLayout,
    validateDebLayout
};