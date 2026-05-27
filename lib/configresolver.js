const fs = require("fs");

const {
    cliOptions,
    resolvedConfig: resolvedConfigTemplate
} = require("../constants/config-schema");

function resolveConfig() {

    const cliConfig = {
        ...cliOptions
    };
    const finalConfig = {
        ...resolvedConfigTemplate
    };

    const args = process.argv.slice(2);

    cliConfig.target = args[0] || null;

    cliConfig.arch = args[1]
        ? args[1].replace("--", "")
        : null;

    const raw = fs.readFileSync(
        "neutralino.config.json",
        "utf-8"
    );

    const config = JSON.parse(raw);

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
            targetConfig.icon || null

    };
    finalConfig.metadata = {

        applicationId:
            config.applicationId || null,

        version:
            config.version || null

    };

    finalConfig.paths = {
        output:
            targetConfig.output
            || "/dist"

    };

    return finalConfig;

}

module.exports = resolveConfig;