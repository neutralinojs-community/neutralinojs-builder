const logger = require("./utils/logger");
const builder = require("./lib/builder");

module.exports = {
    command: "builder",
    register: (cmd) => {
        cmd
            .description("builds installer packages for Neutralinojs apps")
            .arguments("<target>")
            .allowUnknownOption(true)
            .action(async (target, options, command) => {
                const rawArgs = command.parent.rawArgs;
                const separatorIndex = rawArgs.indexOf("--");
                const neuBuildFlags = separatorIndex !== -1
                    ? rawArgs.slice(separatorIndex + 1)
                    : [];

                logger.info("Neutralinojs Builder initialized.");
                logger.info(`Target detected: ${target}`);
                if (neuBuildFlags.length > 0) {
                    logger.info(`Forwarding core build flags: ${neuBuildFlags.join(' ')}`);
                }

                try {
                    await builder.build(target, neuBuildFlags);
                } catch (err) {
                    process.exit(1);
                }
            });
    }
};

if (require.main === module) {
    const args = process.argv.slice(2);
    const separatorIndex = args.indexOf('--');
    const passedFlags = separatorIndex !== -1 ? args.slice(0, separatorIndex) : args;
    const neuBuildFlags = separatorIndex !== -1 ? args.slice(separatorIndex + 1) : [];
    const target = passedFlags.find(arg => !arg.startsWith('-'));

    logger.info("Neutralinojs Builder initialized standalone.");

    if (!target) {
        logger.warn("No target specified. Usage: node index.js <target> -- [neu build flags]");
        process.exit(1);
    } else {
        logger.info(`Target detected: ${target}`);
        if (neuBuildFlags.length > 0) {
            logger.info(`Forwarding core build flags: ${neuBuildFlags.join(' ')}`);
        }
        builder.build(target, neuBuildFlags).catch(() => {
            process.exit(1);
        });
    }
}