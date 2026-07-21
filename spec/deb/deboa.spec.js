const assert = require("assert");
const fs = require("fs");
const Module = require("module");
const os = require("os");
const path = require("path");

const providerPath =
    require.resolve("../../targets/deb/providers/deboa");

function loadProvider(fakeDeboa) {
    const originalLoad = Module._load;

    delete require.cache[providerPath];

    Module._load = function (request, parent, isMain) {
        if (request === "deboa") {
            return {
                Deboa: fakeDeboa
            };
        }

        return originalLoad.call(this, request, parent, isMain);
    };

    const provider = require(providerPath);

    Module._load = originalLoad;

    return provider;
}

function makeTempDir() {
    return fs.mkdtempSync(
        path.join(os.tmpdir(), "neu-builder-deboa-provider-")
    );
}

describe(
    "Deboa Provider",
    () => {
        let tempDir;

        beforeEach(() => {
            tempDir = makeTempDir();
        });

        afterEach(() => {
            fs.rmSync(tempDir, {
                recursive: true,
                force: true
            });
            delete require.cache[providerPath];
        });

        it(
            "should fail when package options are missing",
            async () => {
                const provider = loadProvider(class { });

                await assert.rejects(
                    () => provider.createPackage(),
                    /Missing package options/
                );
            }
        );

        it(
            "should fail when required paths are missing",
            async () => {
                const provider = loadProvider(class { });

                await assert.rejects(
                    () => provider.createPackage({}),
                    /options\.sourceDir is required/
                );

                await assert.rejects(
                    () => provider.createPackage({
                        sourceDir: tempDir
                    }),
                    /options\.targetDir is required/
                );
            }
        );

        it(
            "should pass package options to Deboa and return the generated deb path",
            async () => {
                const sourceDir = path.join(tempDir, "staging");
                const targetDir = path.join(tempDir, "output");
                const calls = [];

                fs.mkdirSync(sourceDir);
                fs.mkdirSync(targetDir);

                class FakeDeboa {
                    constructor(options) {
                        this.options = options;
                        calls.push(options);
                    }

                    async package() {
                        fs.writeFileSync(
                            path.join(this.options.targetDir, "app.deb"),
                            "package"
                        );
                    }
                }

                const provider = loadProvider(FakeDeboa);
                const beforePackage = async () => { };
                const modifyTarHeader = () => { };

                const packagePath = await provider.createPackage({
                    sourceDir,
                    targetDir,
                    installationRoot: "/opt/example",
                    icon: "/tmp/icon.png",
                    controlFileOptions: {
                        packageName: "example"
                    },
                    beforeCreateDesktopEntry: () => { },
                    modifyTarHeader,
                    beforePackage
                });

                assert.strictEqual(
                    packagePath,
                    path.join(targetDir, "app.deb")
                );
                assert.strictEqual(calls.length, 1);
                assert.strictEqual(calls[0].sourceDir, sourceDir);
                assert.strictEqual(calls[0].targetDir, targetDir);
                assert.strictEqual(calls[0].beforePackage, beforePackage);
                assert.strictEqual(calls[0].modifyTarHeader, modifyTarHeader);
            }
        );

        it(
            "should fail when Deboa does not generate a deb file",
            async () => {
                fs.mkdirSync(path.join(tempDir, "output"));

                const provider = loadProvider(class {
                    async package() { }
                });

                await assert.rejects(
                    () => provider.createPackage({
                        sourceDir: tempDir,
                        targetDir: path.join(tempDir, "output")
                    }),
                    /Failed to generate package/
                );
            }
        );
    }
);
