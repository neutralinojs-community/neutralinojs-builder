const logger = require("../../../utils/logger");

async function compileInstaller(scriptPath, options = {}) {
    const NSIS = await import("makensis");

    try {
        const output = await NSIS.compile(scriptPath, options);
        return output;
    } catch (rejection) {
        const message = typeof rejection === "string"
            ? rejection
            : (rejection?.stderr || rejection?.message || "Unknown makensis failure (binary likely not installed or not on PATH).");

        logger.error("MakensisProvider: Compilation failed.");
        throw new Error(`MakensisProvider: ${message}`);
    }
}

module.exports = {
    compileInstaller
};