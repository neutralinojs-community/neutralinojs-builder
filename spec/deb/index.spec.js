const assert = require("assert");

const indexPath =
    require.resolve("../../targets/deb");
const validatorPath =
    require.resolve("../../targets/deb/debvalidator");
const packageBuilderPath =
    require.resolve("../../targets/deb/packagebuilder");

function loadDebTarget(validateDeb, buildPackage) {
    delete require.cache[indexPath];

    require.cache[validatorPath] = {
        id: validatorPath,
        filename: validatorPath,
        loaded: true,
        exports: {
            validateDeb
        }
    };

    require.cache[packageBuilderPath] = {
        id: packageBuilderPath,
        filename: packageBuilderPath,
        loaded: true,
        exports: buildPackage
    };

    return require(indexPath);
}

describe(
    "DEB Target",
    () => {
        let originalConsoleError;

        beforeEach(() => {
            originalConsoleError = console.error;
            console.error = () => {};
        });

        afterEach(() => {
            console.error = originalConsoleError;
            delete require.cache[indexPath];
            delete require.cache[validatorPath];
            delete require.cache[packageBuilderPath];
        });

        it(
            "should validate config, build the package, and return the package path",
            async () => {
                const calls = [];
                const config = {
                    metadata: {
                        applicationId: "com.example.app"
                    }
                };
                const stagingPath = "/tmp/staging";

                const debTarget = loadDebTarget(
                    (receivedConfig) => {
                        calls.push(["validate", receivedConfig]);
                    },
                    async (receivedConfig, receivedStagingPath) => {
                        calls.push([
                            "build",
                            receivedConfig,
                            receivedStagingPath
                        ]);
                        return "/tmp/app.deb";
                    }
                );

                const packagePath = await debTarget.build(
                    config,
                    stagingPath
                );

                assert.strictEqual(packagePath, "/tmp/app.deb");
                assert.deepStrictEqual(calls, [
                    ["validate", config],
                    ["build", config, stagingPath]
                ]);
            }
        );

        it(
            "should not build when validation fails",
            async () => {
                let buildCalled = false;
                const debTarget = loadDebTarget(
                    () => {
                        throw new Error("invalid config");
                    },
                    async () => {
                        buildCalled = true;
                    }
                );

                await assert.rejects(
                    () => debTarget.build({}, "/tmp/staging"),
                    /invalid config/
                );
                assert.strictEqual(buildCalled, false);
            }
        );

        it(
            "should rethrow package builder errors",
            async () => {
                const debTarget = loadDebTarget(
                    () => {},
                    async () => {
                        throw new Error("build failed");
                    }
                );

                await assert.rejects(
                    () => debTarget.build({}, "/tmp/staging"),
                    /build failed/
                );
            }
        );
    }
);
