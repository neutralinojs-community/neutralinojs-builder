const fs = require("fs");
const path = require("path");
const { Deboa } = require("deboa");

async function createPackage(options) {
    if (!options || typeof options !== "object") {
        throw new Error("DeboaProvider: Missing package options.");
    }

    if (!options.sourceDir) {
        throw new Error("DeboaProvider: options.sourceDir is required.");
    }

    if (!options.targetDir) {
        throw new Error("DeboaProvider: options.targetDir is required.");
    }

    const deboa = new Deboa({
        sourceDir: options.sourceDir,
        targetDir: options.targetDir,
        installationRoot: options.installationRoot,
        icon: options.icon,
        controlFileOptions: options.controlFileOptions,
        beforeCreateDesktopEntry: options.beforeCreateDesktopEntry,
        modifyTarHeader: options.modifyTarHeader,
        beforePackage: options.beforePackage
    });

    await deboa.package();

    const generated =
        fs.readdirSync(options.targetDir)
            .sort()
            .find(file =>
                file.endsWith(".deb")
            );

    if (!generated) {
        throw new Error(
            "DeboaProvider: Failed to generate package."
        );
    }

    return path.join(
        options.targetDir,
        generated
    );
}

module.exports = {
    createPackage
};
