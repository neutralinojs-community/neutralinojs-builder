const fs = require("fs");
const path = require("path");
const {
    cliOptions,
    resolvedConfig: resolvedConfigTemplate
} = require("../constants/configschema");

function resolveConfig(
    args = process.argv.slice(2)
) {
    const cliConfig = {
        ...cliOptions
    };
    const finalConfig = {
        ...resolvedConfigTemplate
    };

    cliConfig.target = args[0] || null;

    cliConfig.arch = args[1]
        ? args[1].replace("--", "")
        : null;

    const configPath = path.join(
        __dirname,
        "..",
        "neutralino.config.json"
    );

    const raw = fs.readFileSync(
        configPath,
        "utf-8"
    ); const config = JSON.parse(raw);

    const hostPlatform =
        process.platform === "win32"
            ? "windows"
            : process.platform;

    const builderConfig =
        config.cli?.builder || {};

    let targetPlatform = null;

    let targetConfig = null;

    for (const platform in builderConfig) {

        const targets =
            builderConfig[platform].targets || [];
        const matchedTarget =
            targets.find(
                (target) =>
                    target.target === cliConfig.target
            );
        if (matchedTarget) {
            targetPlatform = platform;
            targetConfig = matchedTarget;
            break;
        }
    }

    if (!targetConfig) {

        const firstPlatform =
            Object.keys(builderConfig)[0];

        targetPlatform = firstPlatform;

        targetConfig =
            builderConfig[firstPlatform]
                ?.targets?.[0]
            || {};
    }
    finalConfig.hostPlatform =
        hostPlatform;
    finalConfig.targetPlatform =
        targetPlatform;
    finalConfig.target =
        targetConfig.target || null;

    finalConfig.arch =
        cliConfig.arch
        || targetConfig.arch?.[0]
        || "x64";

    finalConfig.assets = {

        icon:
            targetConfig.icon || null,

        license:
            targetConfig.license || null,

        sidebarImage:
            targetConfig.sidebarImage || null,

        headerImage:
            targetConfig.headerImage || null,

        background:
            targetConfig.background || null,

    };
    finalConfig.metadata = {

        applicationId:
            config.applicationId || null,

        applicationName:
            config.applicationName || "Neutralino Application",
        version:
            config.version || "1.0.0",

        maintainer:
            targetConfig.maintainer || "Unknown",

        category:
            targetConfig.category || "Utility",

        description:
            targetConfig.description || "Neutralino Application",

    };
    finalConfig.paths = {
        output:
            targetConfig.output
            || "/dist"

    };

    return finalConfig;

}

module.exports = resolveConfig;