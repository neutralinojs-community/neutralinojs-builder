const fs = require("fs");
const path = require("path");

const deboaProvider = require("./providers/deboa");

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

async function buildPackage(config, stagingPath) {
    const metadata = config.metadata || {};

    const packageName = sanitizePackageName(
        metadata.applicationId
    );

    const launcherName = sanitizePackageName(
        metadata.applicationName || packageName
    );

    const outputDir = path.resolve(
        process.cwd(),
        config.paths?.output || "./dist/linux"
    );

    fs.mkdirSync(outputDir, { recursive: true });

    for (const file of fs.readdirSync(outputDir)) {
        if (file.endsWith(".deb")) {
            fs.rmSync(path.join(outputDir, file), {
                force: true,
            });
        }
    }

    const executableName = metadata.resolvedBinaryName;

    if (!executableName) {
        throw new Error(
            "PackageBuilder: Missing metadata.resolvedBinaryName"
        );
    }

    const executablePath = path.join(
        stagingPath,
        executableName
    );

    if (!fs.existsSync(executablePath)) {
        throw new Error(
            `PackageBuilder: Executable not found: ${executablePath}`
        );
    }

    const outputFile = await deboaProvider.createPackage({
        sourceDir: stagingPath,
        targetDir: outputDir,
        installationRoot: `/opt/${packageName}`,
        icon: config.assets?.icon,

        controlFileOptions: {
            packageName,
            version: metadata.version || "1.0.0",
            maintainer:
                metadata.maintainer || "Unknown",
            shortDescription:
                metadata.description ||
                "Neutralino Application",
        },

        beforePackage: async (tempDir) => {
            const usrBin = path.join(
                tempDir,
                "usr",
                "bin"
            ); fs.mkdirSync(usrBin, {
                recursive: true,
            });

            const launcherPath = path.join(
                usrBin,
                launcherName
            );

            fs.writeFileSync(
                launcherPath,
                `#!/bin/sh
                cd /opt/${packageName}
                exec ./${executableName} "$@"
                `
            );

            fs.chmodSync(
                launcherPath,
                0o755
            );
        },

        beforeCreateDesktopEntry: (entry) => {
            entry.Name =
                metadata.applicationName ||
                packageName;

            entry.GenericName =
                metadata.applicationName ||
                packageName;

            entry.Comment =
                metadata.description || "";

            entry.Exec = launcherName;

            entry.Icon = packageName;

            entry.Categories =
                metadata.category || "Utility";

            entry.Terminal = false;

            return entry;
        },

        modifyTarHeader: (header) => {
            const basename = path.basename(
                header.name
            );

            if (
                basename === executableName ||
                basename === launcherName
            ) {
                header.mode = 0o755;
            }

            return header;
        },
    });

    return outputFile;
}

module.exports = buildPackage;