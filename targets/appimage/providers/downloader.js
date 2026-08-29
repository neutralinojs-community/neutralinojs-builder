const fs = require("fs");
const path = require("path");
const https = require("https");
const logger = require("../../../utils/logger");

const TOOL_BASE_URL = "https://github.com/AppImage/appimagetool/releases/download/continuous";
const RUNTIME_BASE_URL = "https://github.com/AppImage/type2-runtime/releases/download/continuous";

function getBinaryName(arch) {
    switch (arch) {
        case "x64":
        case "x86_64": return "appimagetool-x86_64.AppImage";
        case "arm64":
        case "aarch64": return "appimagetool-aarch64.AppImage";
        case "armhf":
        case "arm": return "appimagetool-armhf.AppImage";
        case "ia32":
        case "i686": return "appimagetool-i686.AppImage";
        default: throw new Error(`Unsupported architecture for appimagetool: ${arch}`);
    }
}

function getRuntimeName(arch) {
    switch (arch) {
        case "x64":
        case "x86_64": return "runtime-x86_64";
        case "arm64":
        case "aarch64": return "runtime-aarch64";
        case "armhf":
        case "arm": return "runtime-armhf";
        case "ia32":
        case "i686": return "runtime-i686";
        default: throw new Error(`Unsupported architecture for AppImage runtime: ${arch}`);
    }
}

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const tempPath = `${destPath}.tmp`;
        const cleanup = () => fs.existsSync(tempPath) && fs.unlinkSync(tempPath);

        const request = https.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                response.resume();
                return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
            }

            if (response.statusCode !== 200) {
                response.resume();
                return reject(new Error(`Failed to download file. HTTP Status: ${response.statusCode}`));
            }

            const file = fs.createWriteStream(tempPath);
            response.pipe(file);

            file.on("finish", () => {
                file.close(() => {
                    try {
                        fs.renameSync(tempPath, destPath);
                        resolve(destPath);
                    } catch (error) {
                        cleanup();
                        reject(error);
                    }
                });
            });

            file.on("error", (error) => { cleanup(); reject(error); });
            response.on("error", (error) => { cleanup(); reject(error); });
        });

        request.on("error", (error) => { cleanup(); reject(error); });
    });
}

function isValidFile(filePath, minimumSize) {
    if (!fs.existsSync(filePath)) return false;
    try {
        const stats = fs.statSync(filePath);
        return stats.isFile() && stats.size >= minimumSize;
    } catch {
        return false;
    }
}

async function getAppImageTool(arch = process.arch) {
    const binaryName = getBinaryName(arch);
    const runtimeName = getRuntimeName(arch);

    const downloadDir = path.join(process.cwd(), ".neu-builder-cache");
    const binaryPath = path.join(downloadDir, binaryName);
    const runtimePath = path.join(downloadDir, runtimeName);

    fs.mkdirSync(downloadDir, { recursive: true });

    if (isValidFile(binaryPath, 1_000_000)) {
        logger.info(`Using cached appimagetool at: ${binaryPath}`);
    } else {
        if (fs.existsSync(binaryPath)) {
            logger.warn("Cached appimagetool appears corrupted. Re-downloading...");
            fs.unlinkSync(binaryPath);
        }

        const downloadUrl = `${TOOL_BASE_URL}/${binaryName}`;
        logger.info(`Downloading appimagetool from ${downloadUrl}...`);
        await downloadFile(downloadUrl, binaryPath);

        if (!isValidFile(binaryPath, 1_000_000)) {
            if (fs.existsSync(binaryPath)) fs.unlinkSync(binaryPath);
            throw new Error("Downloaded appimagetool file is invalid or incomplete.");
        }

        fs.chmodSync(binaryPath, 0o755);
        logger.info(`appimagetool downloaded successfully to: ${binaryPath}`);
    }

    if (isValidFile(runtimePath, 500_000)) {
        logger.info(`Using cached AppImage runtime at: ${runtimePath}`);
    } else {
        if (fs.existsSync(runtimePath)) {
            logger.warn("Cached AppImage runtime appears corrupted. Re-downloading...");
            fs.unlinkSync(runtimePath);
        }

        const runtimeUrl = `${RUNTIME_BASE_URL}/${runtimeName}`;
        logger.info(`Downloading AppImage runtime from ${runtimeUrl}...`);
        await downloadFile(runtimeUrl, runtimePath);

        if (!isValidFile(runtimePath, 500_000)) {
            if (fs.existsSync(runtimePath)) fs.unlinkSync(runtimePath);
            throw new Error("Downloaded AppImage runtime is invalid or incomplete.");
        }

        fs.chmodSync(runtimePath, 0o755);
        logger.info(`AppImage runtime downloaded successfully to: ${runtimePath}`);
    }

    return { toolPath: binaryPath, runtimePath };
}

module.exports = {
    getAppImageTool
};