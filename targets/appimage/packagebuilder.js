const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const logger = require("../../utils/logger");
const { getAppImageTool } = require("./providers/downloader");

function sanitizeName(name) {
    return String(name || "neutralino-app")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9.+-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[.-]+|[.-]+$/g, "") || "neutralino-app";
}

function prepareAppDir(config, stagingPath) {
    const appId = sanitizeName(config.metadata.applicationId);
    const appDir = path.join(stagingPath, "AppDir");
    const binDir = path.join(appDir, "usr", "bin");

    fs.mkdirSync(binDir, { recursive: true });
    fs.mkdirSync(path.join(appDir, "usr", "share", "icons", "hicolor", "256x256", "apps"), { recursive: true });

    const executableName = config.metadata.resolvedBinaryName;
    if (!executableName) throw new Error("Missing metadata.resolvedBinaryName");

    const sourceBinaryPath = path.join(stagingPath, executableName);
    if (!fs.existsSync(sourceBinaryPath)) throw new Error(`Executable not found: ${sourceBinaryPath}`);

    const targetBinaryPath = path.join(binDir, executableName);
    fs.copyFileSync(sourceBinaryPath, targetBinaryPath);
    fs.chmodSync(targetBinaryPath, 0o755);

    const isSEA = config.buildType === "sea" || config.metadata.isSEA;
    const resourcesPath = path.join(stagingPath, "resources.neu");

    if (!isSEA) {
        if (!fs.existsSync(resourcesPath)) {
            throw new Error(`Non-SEA build requires 'resources.neu' at ${resourcesPath}, but it was not found.`);
        }
        fs.copyFileSync(resourcesPath, path.join(binDir, "resources.neu"));
    } else if (fs.existsSync(resourcesPath)) {
        fs.copyFileSync(resourcesPath, path.join(binDir, "resources.neu"));
    }

    const appRunPath = path.join(appDir, "AppRun");
    const appRunScript = `#!/bin/sh
SELF=$(readlink -f "$0")
HERE=\${APPDIR:-$(dirname "$SELF")}

BIN_DIR="$HERE/usr/bin"

cd "$BIN_DIR" || exit 1
exec "./${executableName}" "$@"
`;

    fs.writeFileSync(appRunPath, appRunScript);
    fs.chmodSync(appRunPath, 0o755);

    const desktopPath = path.join(appDir, `${appId}.desktop`);
    const desktopContent = `[Desktop Entry]
Name=${config.metadata.applicationName}
Exec=${executableName}
Icon=${appId}
Type=Application
Categories=${config.metadata.category || "Utility"};
StartupWMClass=${executableName}
`;

    fs.writeFileSync(desktopPath, desktopContent);

    if (config.assets?.icon) {
        const iconExt = path.extname(config.assets.icon) || ".png";

        fs.copyFileSync(config.assets.icon, path.join(appDir, `${appId}${iconExt}`));
        fs.copyFileSync(config.assets.icon, path.join(appDir, ".DirIcon"));
        fs.copyFileSync(
            config.assets.icon,
            path.join(appDir, "usr", "share", "icons", "hicolor", "256x256", "apps", `${appId}${iconExt}`)
        );
    }

    return appDir;
}

function getAppImageArch(arch) {
    const normalized = String(arch).toLowerCase();

    switch (normalized) {
        case "arm64":
        case "aarch64":
            return "aarch64";
        case "armhf":
        case "armv7l":
            return "armhf";
        case "x64":
        case "x86_64":
            return "x86_64";
        case "ia32":
        case "x86":
        case "i686":
            return "i686";
        default:
            return normalized;
    }
}

async function buildPackage(config, stagingPath) {
    const appId = sanitizeName(config.metadata.applicationId);
    const outputDir = path.resolve(process.cwd(), config.paths?.output || "./dist/linux");

    fs.mkdirSync(outputDir, { recursive: true });

    const appDirPath = prepareAppDir(config, stagingPath);

    const { toolPath, runtimePath } = await getAppImageTool(config.arch);
    const targetArch = getAppImageArch(config.arch);

    const outputFileName = `${appId}-${config.metadata.version}-${config.arch}.AppImage`;
    const outputPath = path.join(outputDir, outputFileName);

    logger.info(`Executing appimagetool for ${targetArch}...`);

    const result = spawnSync(
        toolPath,
        ["--runtime-file", runtimePath, appDirPath, outputPath],
        {
            env: { ...process.env, ARCH: targetArch },
            stdio: "inherit"
        }
    );

    if (result.error) throw new Error(`Failed to execute appimagetool: ${result.error.message}`);
    if (result.status !== 0) throw new Error(`appimagetool failed with code ${result.status}`);

    return outputPath;
}

module.exports = buildPackage;