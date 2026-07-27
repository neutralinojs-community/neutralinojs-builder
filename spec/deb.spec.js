const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { validateDeb } = require("../targets/deb/debvalidator");
const buildPackage = require("../targets/deb/packagebuilder");
const deboaProvider = require("../targets/deb/providers/deboa");
const debTarget = require("../targets/deb");

describe("DEB Packaging Suite", () => {
    let tempDir;
    let previousCwd;
    let originalCreatePackage;

    beforeEach(() => {
        previousCwd = process.cwd();
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "neu-deb-test-"));
        process.chdir(tempDir);
        originalCreatePackage = deboaProvider.createPackage;
    });

    afterEach(() => {
        process.chdir(previousCwd);
        deboaProvider.createPackage = originalCreatePackage;
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    // 1. Validator Tests
    describe("Validator", () => {
        it("should fail when metadata is missing", () => {
            assert.throws(() => validateDeb({}), /Missing metadata configuration/);
        });

        it("should fail when applicationId is blank or missing", () => {
            assert.throws(() => validateDeb({ metadata: {} }), /applicationId is required/);
            assert.throws(
                () => validateDeb({ metadata: { applicationId: "   " } }),
                /applicationId is required/
            );
        });

        it("should normalize valid config", () => {
            const config = { metadata: { applicationId: "com.example.app" } };
            const validated = validateDeb(config);
            assert.strictEqual(validated.metadata.applicationId, "com.example.app");
        });
    });

    // 2. Package Builder Tests
    describe("Package Builder", () => {
        it("should fail when resolvedBinaryName is missing", async () => {
            await assert.rejects(
                () => buildPackage({ metadata: { applicationId: "com.example.app" } }, tempDir),
                /Missing metadata\.resolvedBinaryName/
            );
        });

        it("should fail when binary does not exist in staging", async () => {
            await assert.rejects(
                () => buildPackage({
                    metadata: {
                        applicationId: "com.example.app",
                        resolvedBinaryName: "missing-app"
                    }
                }, tempDir),
                /Executable not found/
            );
        });

        it("should construct and pass correct options to deboaProvider", async () => {
            const stagingPath = path.join(tempDir, "staging");
            const outputDir = path.join(tempDir, "dist", "linux");
            fs.mkdirSync(stagingPath, { recursive: true });
            fs.mkdirSync(outputDir, { recursive: true });

            // Create dummy binary in staging
            fs.writeFileSync(path.join(stagingPath, "my-app"), "bin");

            let capturedOptions;
            deboaProvider.createPackage = async (options) => {
                capturedOptions = options;
                // Create dummy deb inside targetDir so packagebuilder finds the result
                const fakeDeb = path.join(options.targetDir, "app.deb");
                fs.writeFileSync(fakeDeb, "deb-data");
                return fakeDeb;
            };

            const config = {
                paths: {
                    output: outputDir
                },
                metadata: {
                    applicationId: "Com.Example App!",
                    applicationName: "My App",
                    resolvedBinaryName: "my-app",
                    version: "2.0.0",
                    maintainer: "Dev <dev@example.com>",
                    description: "Test App Description",
                    category: "Utility"
                },
                assets: { icon: "/tmp/icon.png" }
            };

            const resultPath = await buildPackage(config, stagingPath);

            // Verify package builder output path matches outputDir
            assert.strictEqual(resultPath, path.join(outputDir, "app.deb"));
            assert.strictEqual(capturedOptions.sourceDir, stagingPath);
            assert.strictEqual(capturedOptions.targetDir, outputDir);
            assert.strictEqual(capturedOptions.installationRoot, "/opt/com.example-app");
            assert.strictEqual(capturedOptions.icon, "/tmp/icon.png");

            assert.deepStrictEqual(capturedOptions.controlFileOptions, {
                packageName: "com.example-app",
                version: "2.0.0",
                maintainer: "Dev <dev@example.com>",
                shortDescription: "Test App Description"
            });

            // Verify Desktop Entry transformer hook
            const desktopEntry = capturedOptions.beforeCreateDesktopEntry({});
            assert.deepStrictEqual(desktopEntry, {
                Name: "My App",
                GenericName: "My App",
                Comment: "Test App Description",
                Exec: "my-app",
                Icon: "com.example-app",
                Categories: "Utility",
                Terminal: false
            });

            // Verify Tar Header transformer hook
            const execHeader = capturedOptions.modifyTarHeader({
                name: "opt/com.example-app/my-app",
                mode: 0o644
            });
            assert.strictEqual(execHeader.mode, 0o755);
        });
    });

    // 3. Target Entry Point
    describe("DEB Target Entry", () => {
        it("should reject invalid configuration before building", async () => {
            await assert.rejects(
                () => debTarget.build({}, tempDir),
                /Missing metadata configuration/
            );
        });
    });
});