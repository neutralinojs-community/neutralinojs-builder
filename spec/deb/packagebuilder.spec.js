const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const builderPath =
    require.resolve("../../targets/deb/packagebuilder");
const providerPath =
    require.resolve("../../targets/deb/providers/deboa");

function makeTempDir() {
    return fs.mkdtempSync(
        path.join(os.tmpdir(), "neu-builder-deb-packagebuilder-")
    );
}

function loadBuilder(createPackage) {
    delete require.cache[builderPath];

    require.cache[providerPath] = {
        id: providerPath,
        filename: providerPath,
        loaded: true,
        exports: {
            createPackage
        }
    };

    return require(builderPath);
}

describe(
    "DEB Package Builder",
    () => {
        let tempDir;
        let previousCwd;

        beforeEach(() => {
            previousCwd = process.cwd();
            tempDir = makeTempDir();
            process.chdir(tempDir);
        });

        afterEach(() => {
            process.chdir(previousCwd);
            delete require.cache[builderPath];
            delete require.cache[providerPath];
            fs.rmSync(tempDir, {
                recursive: true,
                force: true
            });
        });

        it(
            "should fail when configuration is missing",
            async () => {
                const buildPackage = loadBuilder(async () => {});

                await assert.rejects(
                    () => buildPackage(),
                    /Missing DEB configuration/
                );
            }
        );

        it(
            "should fail when resolved binary name is missing",
            async () => {
                const stagingPath = path.join(tempDir, "staging");
                const buildPackage = loadBuilder(async () => {});

                fs.mkdirSync(stagingPath);

                await assert.rejects(
                    () => buildPackage({
                        metadata: {
                            applicationId: "com.example.app"
                        }
                    }, stagingPath),
                    /Missing metadata\.resolvedBinaryName/
                );
            }
        );

        it(
            "should remove stale deb files and create package options",
            async () => {
                const stagingPath = path.join(tempDir, "staging");
                const outputDir = path.join(tempDir, "release");
                const captured = {};

                fs.mkdirSync(stagingPath);
                fs.mkdirSync(outputDir);
                fs.writeFileSync(path.join(stagingPath, "Example Bin"), "bin");
                fs.writeFileSync(path.join(outputDir, "old.deb"), "old");
                fs.writeFileSync(path.join(outputDir, "keep.txt"), "keep");

                const buildPackage = loadBuilder(async (options) => {
                    Object.assign(captured, options);
                    return path.join(outputDir, "new.deb");
                });

                const packagePath = await buildPackage({
                    paths: {
                        output: "release"
                    },
                    metadata: {
                        applicationId: "Com.Example App!",
                        applicationName: "Example App",
                        resolvedBinaryName: "Example Bin",
                        version: "2.3.4",
                        maintainer: "Maintainer <m@example.com>",
                        description: "Example description",
                        category: "Utility"
                    },
                    assets: {
                        icon: "/tmp/icon.png"
                    }
                }, stagingPath);

                assert.strictEqual(packagePath, path.join(outputDir, "new.deb"));
                assert.strictEqual(fs.existsSync(path.join(outputDir, "old.deb")), false);
                assert.strictEqual(fs.existsSync(path.join(outputDir, "keep.txt")), true);
                assert.strictEqual(captured.sourceDir, stagingPath);
                assert.strictEqual(captured.targetDir, outputDir);
                assert.strictEqual(captured.installationRoot, "/opt/com.example-app");
                assert.strictEqual(captured.icon, "/tmp/icon.png");
                assert.deepStrictEqual(captured.controlFileOptions, {
                    packageName: "com.example-app",
                    version: "2.3.4",
                    maintainer: "Maintainer <m@example.com>",
                    shortDescription: "Example description"
                });
            }
        );

        it(
            "should default package metadata and write executable launcher",
            async () => {
                const stagingPath = path.join(tempDir, "staging");
                const buildTempDir = path.join(tempDir, "package-root");
                let captured;

                fs.mkdirSync(stagingPath);
                fs.mkdirSync(buildTempDir);
                fs.writeFileSync(path.join(stagingPath, "app"), "bin");

                const buildPackage = loadBuilder(async (options) => {
                    captured = options;
                    await options.beforePackage(buildTempDir);
                    return path.join(options.targetDir, "app.deb");
                });

                await buildPackage({
                    metadata: {
                        applicationId: "...",
                        resolvedBinaryName: "app"
                    }
                }, stagingPath);

                const launcherPath = path.join(
                    buildTempDir,
                    "usr",
                    "bin",
                    "neutralino-app"
                );

                assert.strictEqual(
                    captured.installationRoot,
                    "/opt/neutralino-app"
                );
                assert.strictEqual(
                    captured.controlFileOptions.version,
                    "1.0.0"
                );
                assert.ok(
                    fs.readFileSync(launcherPath, "utf8")
                        .includes("exec ./app")
                );
                assert.strictEqual(
                    fs.statSync(launcherPath).mode & 0o777,
                    0o755
                );
            }
        );

        it(
            "should customize desktop entries and executable tar headers",
            async () => {
                const stagingPath = path.join(tempDir, "staging");
                let captured;

                fs.mkdirSync(stagingPath);
                fs.writeFileSync(path.join(stagingPath, "my-bin"), "bin");

                const buildPackage = loadBuilder(async (options) => {
                    captured = options;
                    return path.join(options.targetDir, "app.deb");
                });

                await buildPackage({
                    metadata: {
                        applicationId: "com.example.app",
                        applicationName: "My App",
                        resolvedBinaryName: "my-bin",
                        description: "Useful app",
                        category: "Utility"
                    }
                }, stagingPath);

                const entry = captured.beforeCreateDesktopEntry({});
                const executableHeader = captured.modifyTarHeader({
                    name: "opt/com.example.app/my-bin",
                    mode: 0o644
                });
                const launcherHeader = captured.modifyTarHeader({
                    name: "usr/bin/my-app",
                    mode: 0o644
                });
                const resourceHeader = captured.modifyTarHeader({
                    name: "opt/com.example.app/resources.neu",
                    mode: 0o644
                });

                assert.deepStrictEqual(entry, {
                    Name: "My App",
                    GenericName: "My App",
                    Comment: "Useful app",
                    Exec: "my-app",
                    Icon: "com.example.app",
                    Categories: "Utility",
                    Terminal: false
                });
                assert.strictEqual(executableHeader.mode, 0o755);
                assert.strictEqual(launcherHeader.mode, 0o755);
                assert.strictEqual(resourceHeader.mode, 0o644);
            }
        );
    }
);
