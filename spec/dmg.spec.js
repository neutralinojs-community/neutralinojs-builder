const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Module = require("module");

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
    if (request === "appdmg") {
        return () => ({ on() { return this; } });
    }

    return originalLoad.call(this, request, parent, isMain);
};

const buildPackage = require("../targets/dmg/packagebuilder");
const { validateDmg } = require("../targets/dmg/dmgvalidator");
const appdmgProvider = require("../targets/dmg/providers/appdmg");

Module._load = originalLoad;

describe("DMG Packaging Suite", () => {
    let tempDir;
    let previousCwd;
    let originalCreatePackage;

    beforeEach(() => {
        previousCwd = process.cwd();
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "neu-dmg-test-"));
        process.chdir(tempDir);
        originalCreatePackage = appdmgProvider.createPackage;
    });

    afterEach(() => {
        process.chdir(previousCwd);
        appdmgProvider.createPackage = originalCreatePackage;

        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    function createStaging() {
        const stagingPath = path.join(tempDir, "staging");
        fs.mkdirSync(stagingPath, { recursive: true });
        fs.writeFileSync(path.join(stagingPath, "my-app"), "binary");
        return stagingPath;
    }

    function createConfig(overrides = {}) {
        return {
            paths: { output: path.join(tempDir, "dist", "mac") },
            metadata: {
                applicationId: "com.example.app",
                applicationName: "My App",
                resolvedBinaryName: "my-app",
                version: "2.0.0"
            },
            assets: {},
            ...overrides
        };
    }

    async function build(config, stagingPath) {
        return buildPackage(validateDmg(config), stagingPath);
    }

    async function capturePackageOptions(config, stagingPath) {
        let capturedOptions;

        appdmgProvider.createPackage = async (options) => {
            capturedOptions = options;
            return options.target;
        };

        await build(config, stagingPath);
        return capturedOptions;
    }

    describe("Package Builder", () => {
        it("should pass the configured output directory", async () => {
            const stagingPath = createStaging();
            const outputDir = path.join(tempDir, "custom-output");
            const options = await capturePackageOptions(
                createConfig({ paths: { output: outputDir } }),
                stagingPath
            );

            assert.strictEqual(path.dirname(options.target), outputDir);
        });

        it("should pass the configured icon", async () => {
            const stagingPath = createStaging();
            const iconPath = path.join(tempDir, "app.icns");
            fs.writeFileSync(iconPath, "icon");

            const options = await capturePackageOptions(
                createConfig({ assets: { icon: iconPath } }),
                stagingPath
            );

            assert.strictEqual(options.specification.icon, iconPath);
        });

        it("should pass the configured background", async () => {
            const stagingPath = createStaging();
            const backgroundPath = path.join(tempDir, "background.png");
            fs.writeFileSync(backgroundPath, "background");

            const options = await capturePackageOptions(
                createConfig({ assets: { background: backgroundPath } }),
                stagingPath
            );

            assert.strictEqual(options.specification.background, backgroundPath);
        });

        for (const arch of ["x64", "arm64", "universal"]) {
            it(`should generate the correct filename for ${arch}`, async () => {
                const stagingPath = createStaging();
                const options = await capturePackageOptions(
                    createConfig({ arch }),
                    stagingPath
                );

                assert.strictEqual(
                    path.basename(options.target),
                    `com.example.app-2.0.0-${arch}.dmg`
                );
            });
        }

        it("should pass all supported DMG options correctly", async () => {
            const stagingPath = createStaging();
            const outputDir = path.join(tempDir, "custom-output");
            const iconPath = path.join(tempDir, "app.icns");
            const backgroundPath = path.join(tempDir, "background.png");

            fs.writeFileSync(iconPath, "icon");
            fs.writeFileSync(backgroundPath, "background");

            const options = await capturePackageOptions(
                createConfig({
                    arch: "arm64",
                    paths: { output: outputDir },
                    assets: { icon: iconPath, background: backgroundPath }
                }),
                stagingPath
            );

            assert.strictEqual(path.dirname(options.target), outputDir);
            assert.strictEqual(path.basename(options.target), "com.example.app-2.0.0-arm64.dmg");
            assert.strictEqual(options.specification.icon, iconPath);
            assert.strictEqual(options.specification.background, backgroundPath);
        });
    });
});