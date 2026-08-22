const cliOptions = {
    target: null,
    arch: null,
    output: null
};

const resolvedConfig = {
    hostPlatform: null,
    targetPlatform: null,
    target: null,
    arch: null,
    buildType: "standard",
    assets: {
        icon: null,
        license: null,
        sidebarImage: null,
        headerImage: null,
        background: null
    },
    metadata: {
        applicationId: null,
        applicationName: null,
        binaryName: null,
        version: null,
        maintainer: null,
        category: null,
        description: null,
        resolvedBinaryName: null
    },
    maintainerScripts: {
        preinst: null,
        postinst: null,
        prerm: null,
        postrm: null
    },
    paths: {
        output: null
    }
};

module.exports = {
    cliOptions,
    resolvedConfig

};