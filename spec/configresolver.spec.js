const assert = require("assert");
const resolveConfig =
    require("../lib/configresolver");

describe(
    "Config Resolver",
    () => {
        it(
            "should detect host and target platforms separately",
            () => {

                const config =
                    resolveConfig([
                        "nsis",
                        "--x64"
                    ]);
                assert.equal(
                    config.targetPlatform,
                    "windows"
                );
                assert.ok(
                    config.hostPlatform
                );
            }
        );
        it(
            "should resolve nsis target arch x64",
            () => {

                const config =
                    resolveConfig([
                        "nsis",
                        "--x64"
                    ]);

                assert.equal(
                    config.target,
                    "nsis"
                );

                assert.equal(
                    config.arch,
                    "x64"
                );

                assert.equal(
                    config.targetPlatform,
                    "windows"
                );

            }
        );

        it(
            "should resolve appimage target arch x64",
            () => {

                const config =
                    resolveConfig([
                        "appimage",
                        "--x64"
                    ]);

                assert.equal(
                    config.target,
                    "appimage"
                );

                assert.equal(
                    config.arch,
                    "x64"
                );

                assert.equal(
                    config.targetPlatform,
                    "linux"
                );

            }
        );

        it(
            "should resolve dmg target arch x64",
            () => {

                const config =
                    resolveConfig([
                        "dmg",
                        "--x64"
                    ]);

                assert.equal(
                    config.target,
                    "dmg"
                );

                assert.equal(
                    config.arch,
                    "x64"
                );

                assert.equal(
                    config.targetPlatform,
                    "mac"
                );

            }
        );

    }
);