const fs = require("fs");
const path = require("path");
const logger = require("../../utils/logger");
const appdmgProvider = require("./providers/appdmg");

function sanitizePackageName(name) {
    return (
        String(name || "neutralino-app")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9.+-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^[.-]+|[.-]+$/g, "") ||
        "neutralino-app"
    );
}

function prepareAppBundle(config, stagingPath) {
    const metadata = config.metadata || {};
    const appName = metadata.applicationName || "NeutralinoApp";
    const appId = metadata.applicationId || "com.neutralino.app";
    const executableName = metadata.resolvedBinaryName;

    if (!executableName) {
        throw new Error("PackageBuilder: Missing metadata.resolvedBinaryName");
    }

    const appBundlePath = path.join(stagingPath, `${appName}.app`);
    const contentsPath = path.join(appBundlePath, "Contents");
    const macOsPath = path.join(contentsPath, "MacOS");
    const resourcesPath = path.join(contentsPath, "Resources");

    fs.mkdirSync(macOsPath, { recursive: true });
    fs.mkdirSync(resourcesPath, { recursive: true });

    // Copy Main Binary
    const sourceBinary = path.join(stagingPath, executableName);
    const targetBinary = path.join(macOsPath, executableName);

    if (!fs.existsSync(sourceBinary)) {
        throw new Error(`PackageBuilder: Executable not found: ${sourceBinary}`);
    }

    fs.copyFileSync(sourceBinary, targetBinary);
    fs.chmodSync(targetBinary, 0o755);

    // Copy Neutralino resources bundle if present in staging
    const stagingResources = path.join(stagingPath, "resources.neu");
    if (fs.existsSync(stagingResources)) {
        fs.copyFileSync(stagingResources, path.join(macOsPath, "resources.neu"));
        fs.copyFileSync(stagingResources, path.join(resourcesPath, "resources.neu"));
    }

    // Copy Icon file to Bundle Resources if available
    let iconFileName = null;
    if (config.assets?.icon && fs.existsSync(config.assets.icon)) {
        iconFileName = path.basename(config.assets.icon);
        fs.copyFileSync(config.assets.icon, path.join(resourcesPath, iconFileName));
    }
    // Generate Info.plist
    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${executableName}</string>
    <key>CFBundleIdentifier</key>
    <string>${appId}</string>
    <key>CFBundleName</key>
    <string>${appName}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>${metadata.version || "1.0.0"}</string>
    ${iconFileName ? `<key>CFBundleIconFile</key>\n    <string>${iconFileName}</string>` : ""}
</dict>
</plist>`;

    fs.writeFileSync(path.join(contentsPath, "Info.plist"), plistContent);

    return appBundlePath;
}

async function buildPackage(config, stagingPath) {
    const metadata = config.metadata || {};

    const packageName = sanitizePackageName(
        metadata.applicationId
    );

    const appName = metadata.applicationName || packageName;

    const outputDir = path.resolve(
        process.cwd(),
        config.paths?.output || "./dist/mac"
    );

    fs.mkdirSync(outputDir, { recursive: true });

    for (const file of fs.readdirSync(outputDir)) {
        if (file.endsWith(".dmg")) {
            fs.rmSync(path.join(outputDir, file), {
                force: true,
            });
        }
    }

    const appBundlePath = prepareAppBundle(config, stagingPath);
    const outputFileName = `${packageName}-${metadata.version || "1.0.0"}-${config.arch || "x64"}.dmg`;
    const targetDmgPath = path.join(outputDir, outputFileName);

    const specification = {
        title: appName,
        icon: config.assets?.icon || undefined,
        background: config.assets?.background || undefined,
        "icon-size": config.iconSize,
        window: {
            size: {
                width: config.window.width,
                height: config.window.height
            }
        },
        contents: [
            {
                x: config.applicationsSymlinkPosition.x,
                y: config.applicationsSymlinkPosition.y,
                type: "link",
                path: "/Applications"
            },
            {
                x: config.appPosition.x,
                y: config.appPosition.y,
                type: "file",
                path: appBundlePath
            }
        ]
    };

    if (config.assets?.license) {
        specification["code-sign"] = specification["code-sign"] || {};
        specification.license = {
            defaultLanguage: "en_US",
            licenses: {
                en_US: config.assets.license
            }
        };
    }

    logger.info("DMG: Generating DMG package with appdmg...");
    const outputFile = await appdmgProvider.createPackage({
        target: targetDmgPath,
        basepath: process.cwd(),
        specification
    });

    return outputFile;
}

module.exports = buildPackage;