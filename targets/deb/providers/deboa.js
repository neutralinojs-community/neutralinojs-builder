const fs = require("fs");
const path = require("path");
const { Deboa } = require("deboa");

async function createPackage(options) {

    const deboa = new Deboa({
        sourceDir: options.sourceDir,
        targetDir: options.targetDir,
        installationRoot: options.installationRoot,
        icon: options.icon,
        controlFileOptions: options.controlFileOptions,
        beforeCreateDesktopEntry: options.beforeCreateDesktopEntry,
        modifyTarHeader: options.modifyTarHeader
    });

    await deboa.package();

    const generated =
        fs.readdirSync(options.targetDir)
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