const cliOptions = {
    target: null,
    arch: null,
    output: null
};

const resolvedConfig = {
    hostPlatform: null,
    targetPlatform: null,
    target: null,
    arch: "x64",
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
        version: null,
        maintainer: null,
        category: null,
        description: null
    },
    paths: {
        output: null
    }
};

module.exports = {
    cliOptions,
    resolvedConfig

};