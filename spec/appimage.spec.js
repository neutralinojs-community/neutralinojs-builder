const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { validateAppImage } = require("../targets/appimage/appimagevalidator");
const buildPackage = require("../targets/appimage/packagebuilder");
const appImageTarget = require("../targets/appimage");

describe("AppImage Packaging Suite", () => {
    let tempDir;
    let previousCwd;

    beforeEach(() => {
        previousCwd = process.cwd();
        tempDir = fs.mkdtempSync(
            path.join(os.tmpdir(), "neu-appimage-test-")
        );
        process.chdir(tempDir);
    });

    afterEach(() => {
        process.chdir(previousCwd);

        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, {
                recursive: true,
                force: true
            });
        }
    });

    describe("Validator", () => {
        it("should fail when metadata is missing", () => {
            assert.throws(
                () => validateAppImage({}),
                /Missing metadata configuration/
            );
        });

        it("should fail when applicationId is missing", () => {
            assert.throws(
                () => validateAppImage({ metadata: {} }),
                /metadata\.applicationId is required/
            );
        });

        it("should fail when required icon is missing", () => {
            assert.throws(
                () =>
                    validateAppImage({
                        metadata: {
                            applicationId: "com.example.app"
                        }
                    }),
                /Required asset 'icon' is missing/
            );
        });

        it("should validate a valid configuration", () => {
            const iconPath = path.join(tempDir, "icon.png");

            fs.writeFileSync(iconPath, "fake-icon");

            const config = {
                metadata: {
                    applicationId: "com.example.app"
                },
                assets: {
                    icon: iconPath
                }
            };

            const validated = validateAppImage(config);

            assert.strictEqual(validated.assets.icon, iconPath);
        });
    });

    describe("Package Builder", () => {
        it("should fail when resources.neu is missing", async () => {
            const binaryName = "my-app";

            fs.writeFileSync(path.join(tempDir, binaryName), "fake-binary");

            const iconPath = path.join(tempDir, "icon.png");
            fs.writeFileSync(iconPath, "fake-icon");

            const config = {
                metadata: {
                    applicationId: "com.example.app",
                    applicationName: "My App",
                    resolvedBinaryName: binaryName,
                    version: "1.0.0"
                },
                assets: {
                    icon: iconPath
                },
                arch: "x64"
            };

            await assert.rejects(
                () => buildPackage(config, tempDir),
                /Non-SEA build requires 'resources\.neu'/
            );
        });

        it("should create the correct AppDir structure", async () => {
            const binaryName = "my-app";

            fs.writeFileSync(path.join(tempDir, binaryName), "fake-binary");

            fs.writeFileSync(path.join(tempDir, "resources.neu"), "fake-resources");

            const iconPath = path.join(tempDir, "icon.png");
            fs.writeFileSync(iconPath, "fake-icon");

            const cacheDir = path.join(
                tempDir,
                ".neu-builder-cache"
            );

            fs.mkdirSync(cacheDir, {
                recursive: true
            });

            const fakeTool = path.join(
                cacheDir,
                "appimagetool-x86_64.AppImage"
            );

            const fakeToolScript = `#!/bin/sh
RUNTIME_FILE="$2"
APP_DIR="$3"
OUTPUT="$4"
        
printf 'fake-appimage' > "$OUTPUT"
        
exit 0
`;

            fs.writeFileSync(
                fakeTool,
                fakeToolScript + "#".repeat(1_100_000)
            );

            fs.chmodSync(fakeTool, 0o755);

            const config = {
                paths: {
                    output: path.join(tempDir, "dist", "linux")
                },
                metadata: {
                    applicationId: "Com.Example App!",
                    applicationName: "My App",
                    resolvedBinaryName: binaryName,
                    version: "2.0.0",
                    category: "Utility"
                },
                assets: {
                    icon: iconPath
                },
                arch: "x64"
            };

            const outputPath = await buildPackage(config, tempDir);

            const appId = "com.example-app";
            const appDir = path.join(tempDir, "AppDir");

            // AppDir
            assert.ok(fs.existsSync(appDir));

            // Application binary
            assert.ok(fs.existsSync(path.join(appDir, "usr", "bin", binaryName)));

            // resources.neu
            assert.ok(fs.existsSync(path.join(appDir, "usr", "bin", "resources.neu")));

            // AppRun
            assert.ok(fs.existsSync(path.join(appDir, "AppRun")));

            // Desktop entry
            const desktopPath = path.join(appDir, `${appId}.desktop`);

            assert.ok(fs.existsSync(desktopPath));

            const desktopEntry = fs.readFileSync(desktopPath, "utf8");

            assert.match(desktopEntry, /Name=My App/);
            assert.match(desktopEntry, /Exec=my-app/);
            assert.match(desktopEntry, /Icon=com\.example-app/);

            // Icons
            assert.ok(fs.existsSync(path.join(appDir, `${appId}.png`)));

            assert.ok(fs.existsSync(path.join(appDir, ".DirIcon")));

            assert.ok(fs.existsSync(path.join(appDir, "usr", "share", "icons", "hicolor", "256x256", "apps", `${appId}.png`)));
            // Final AppImage
            assert.strictEqual(outputPath, path.join(config.paths.output, "com.example-app-2.0.0-x64.AppImage"));

            assert.ok(fs.existsSync(outputPath));
        });
    });

    describe("AppImage Target Entry", () => {
        it("should reject invalid configuration before building", async () => {
            await assert.rejects(
                () => appImageTarget.build({}, tempDir),
                /Missing metadata configuration/
            );
        });
    });
});