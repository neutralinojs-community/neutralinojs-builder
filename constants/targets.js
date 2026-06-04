const targets = {
    deb: {
        targetPlatform: "linux",
        requiredTools: ["dpkg-deb"],
        supportedHosts: ["linux", "mac"],
        supportedViaWSL: ["windows"]
    },
    appimage: {
        targetPlatform: "linux",
        requiredTools: ["appimagetool"],
        supportedHosts: ["linux", "mac"],
        supportedViaWSL: ["windows"]
    },
    nsis: {
        targetPlatform: "windows",
        requiredTools: ["makensis"],
        supportedHosts: ["linux", "windows", "mac"]
    },
    dmg: {
        targetPlatform: "mac",
        requiredTools: ["hdiutil"],
        supportedHosts: ["mac"]
    }
};

module.exports = targets;