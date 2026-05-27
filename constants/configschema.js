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
    assets: {},
    metadata: {},
    paths: {}

};

module.exports = {
    cliOptions,
    resolvedConfig

};