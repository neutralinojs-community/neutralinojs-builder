const fs = require("fs");
const path = require("path");
const fileUtils = require("../../utils/fileutils");
const logger = require("../../utils/logger");
const makensisProvider = require("./providers/makensis");

function sanitizeAppName(name) {
    return String(name || "Neutralino Application").trim();
}

function findBinaryFile(stagingPath) {
    const files = fs.readdirSync(stagingPath);

    const binaryFile = files.find((file) => {
        if (file === "resources.neu" || file.endsWith(".nsi")) {
            return false;
        }
        const fullPath = path.join(stagingPath, file);
        return fs.statSync(fullPath).isFile();
    });

    if (!binaryFile) {
        throw new Error("PackageBuilder: Unable to locate Neutralino binary.");
    }

    return binaryFile;
}

function buildOptionalBlock(directive, assetPath) {
    if (!assetPath) {
        return "";
    }
    return `${directive} "${assetPath}"`;
}

async function buildPackage(config, stagingPath) {
    const metadata = config.metadata || {};
    const assets = config.assets || {};

    const appName = sanitizeAppName(metadata.applicationName);
    const binaryName = findBinaryFile(stagingPath);

    const outputDir = path.resolve(
        process.cwd(),
        config.paths?.output || "./dist/windows"
    );
    fileUtils.ensureDirectory(outputDir);

    for (const file of fs.readdirSync(outputDir)) {
        if (file.endsWith(".exe")) {
            fs.rmSync(path.join(outputDir, file), { force: true });
        }
    }

    const outputFile = path.join(outputDir, `${appName}-setup.exe`);

    const hasResources = fs.existsSync(path.join(stagingPath, "resources.neu"));

    const scriptTemplate = fileUtils.readTemplate("nsis/installer.nsi");

    const script = fileUtils.replacePlaceholders(scriptTemplate, {
        APP_NAME: appName,
        APP_ID: metadata.applicationId,
        OUTPUT_FILE: outputFile,
        ICON_PATH: assets.icon,
        BINARY_PATH: path.join(stagingPath, binaryName),
        BINARY_NAME: binaryName,
        RESOURCES_LINE: hasResources
            ? `File "${path.join(stagingPath, "resources.neu")}"`
            : "",
        SIDEBAR_BLOCK: buildOptionalBlock(
            "!define MUI_WELCOMEFINISHPAGE_BITMAP",
            assets.sidebarImage
        ),
        HEADER_BLOCK: buildOptionalBlock(
            "!define MUI_HEADERIMAGE_BITMAP",
            assets.headerImage
        ),
        LICENSE_BLOCK: assets.license
            ? `!insertmacro MUI_PAGE_LICENSE "${assets.license}"`
            : ""
    });

    const scriptPath = path.join(stagingPath, "installer.nsi");
    fileUtils.writeFile(scriptPath, script);

    logger.info("PackageBuilder: Compiling NSIS installer...");
    await makensisProvider.compileInstaller(scriptPath, { verbose: 2 });

    if (!fs.existsSync(outputFile)) {
        throw new Error("PackageBuilder: Installer was not generated.");
    }

    return outputFile;
}

module.exports = {
    buildPackage
};