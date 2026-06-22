const fs = require("fs");
const path = require("path");

const deboaProvider =
    require("./providers/deboa");

function sanitizePackageName(name) {
    return String(name || "neutralino-app")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9.+-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[.-]+|[.-]+$/g, "") || "neutralino-app";
}

async function buildPackage(config, stagingPath) {

    const metadata =
        config.metadata || {};

    const packageName =
        sanitizePackageName(
            metadata.applicationId
        );

    const outputDir = path.resolve(
        process.cwd(),
        config.paths?.output ||
        "./dist/linux"
    );

    fs.mkdirSync(
        outputDir,
        { recursive: true }
    );

    for (const file of fs.readdirSync(outputDir)) {
        if (file.endsWith(".deb")) {
            fs.rmSync(
                path.join(
                    outputDir,
                    file
                ),
                { force: true }
            );
        }
    }

    const executableName =
        metadata.resolvedBinaryName;

    if (!executableName) {
        throw new Error(
            "PackageBuilder: Missing metadata.resolvedBinaryName"
        );
    }

    const outputFile =
        await deboaProvider.createPackage({
            sourceDir: stagingPath,
            targetDir: outputDir,
            installationRoot: `/opt/${packageName}`,
            icon: config.assets?.icon || undefined,
            controlFileOptions: {
                packageName,
                version: metadata.version || "1.0.0",
                maintainer: metadata.maintainer || "Unknown",
                shortDescription: metadata.description || "Neutralino Application",
            },
            beforeCreateDesktopEntry:
                (entry) => {
                    entry.Name = metadata.applicationName || packageName;
                    entry.GenericName = metadata.applicationName || packageName;
                    entry.Comment = metadata.description || "";
                    entry.Exec = `/bin/sh -c "cd /opt/${packageName} && ./${executableName}"`;
                    entry.Icon = packageName;
                    entry.Categories = metadata.category || "Utility";
                    entry.Terminal = false;
                    return entry;
                },

            // TODO: ADD SYMLINK LATER. Handle it later or remove this. But keeping this for reference.
            // additionalTarEntries: [
            //     {
            //         gname: "root",
            //         uname: "root",
            //         type: "symlink",
            //         mode: parseInt(
            //             "777",
            //             8
            //         ),
            //         linkname: `../../opt/${packageName}/${executableName}`,
            //         name:`usr/bin/${executableName}`
            //     }
            // ],

            modifyTarHeader:
                (header) => {

                    if (
                        path.basename(
                            header.name
                        ) === executableName
                    ) {
                        header.mode =
                            parseInt(
                                "0755",
                                8
                            );
                    }

                    return header;
                }
        });

    const stats = fs.statSync(outputFile);

    // TODO: Handle it later or remove this. But keeping this for reference.
    // Temp fix/workaround for Deboa odd-size archive issue
    // if (stats.size % 2 !== 0) {
    //     fs.appendFileSync(
    //         outputFile,
    //         "\n"
    //     );
    // }

    return outputFile;
}

module.exports =
    buildPackage;