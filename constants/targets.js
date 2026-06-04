const targets = {
    deb: {
        targetPlatform: "linux",
        requiredTools: ["dpkg-deb"],
        supportedHosts: ["linux", "mac"],
        supportedViaWSL: ["windows"],
        supportedArchitectures: ["x64", "armhf", "arm64"]
    },
    appimage: {
        targetPlatform: "linux",
        requiredTools: ["appimagetool"],
        supportedHosts: ["linux", "mac"],
        supportedViaWSL: ["windows"],
        supportedArchitectures: ["x64", "arm64"]
    },
    nsis: {
        targetPlatform: "windows",
        requiredTools: ["makensis"],
        supportedHosts: ["linux", "windows", "mac"],
        supportedArchitectures: ["x64"]
    },
    dmg: {
        targetPlatform: "mac",
        requiredTools: ["hdiutil"],
        supportedHosts: ["mac"],
        supportedArchitectures: ["x64", "arm64", "universal"]
    }
};

module.exports = targets;