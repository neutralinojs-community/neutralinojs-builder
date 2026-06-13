const assert = require("assert");

const resolveConfig =
    require("../lib/configresolver");

function validateTarget(
    target,
    arch,
    platform
) {

    const config =
        resolveConfig([
            target,
            `--${arch}`
        ]);

    assert.equal(
        config.target,
        target
    );

    assert.equal(
        config.arch,
        arch
    );

    assert.equal(
        config.targetPlatform,
        platform
    );

}

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
        describe(
            "NSIS",
            () => {
                it(
                    "should resolve x64",
                    () => {

                        validateTarget("nsis", "x64", "windows");
                    }
                );
                it(
                    "should resolve ia32",
                    () => {
                        validateTarget("nsis", "ia32", "windows");
                    }
                );
            }
        );
        describe(
            "DEB",
            () => {
                it(
                    "should resolve x64",
                    () => {
                        validateTarget("deb", "x64", "linux");
                    }
                );
                it(
                    "should resolve ia32",
                    () => {
                        validateTarget("deb", "ia32", "linux");
                    }
                );
                it(
                    "should resolve armhf",
                    () => {
                        validateTarget("deb", "armhf", "linux");

                    }
                );
            }
        );
        describe(
            "AppImage",
            () => {
                it(
                    "should resolve x64",
                    () => {
                        validateTarget("appimage", "x64", "linux");

                    }
                );
                it(
                    "should resolve arm64",
                    () => {
                        validateTarget("appimage", "arm64", "linux");
                    }
                );
            }
        );
        describe(
            "DMG",
            () => {
                it(
                    "should resolve x64",
                    () => {

                        validateTarget("dmg", "x64", "mac");

                    }
                );
                it(
                    "should resolve arm64",
                    () => {

                        validateTarget("dmg", "arm64", "mac");
                    }
                );
                it(
                    "should resolve universal",
                    () => {
                        validateTarget("dmg", "universal", "mac");

                    }
                );

            }
        );

    }
);