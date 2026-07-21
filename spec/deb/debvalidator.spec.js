const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { validateDeb } =
    require("../../targets/deb/debvalidator");

function makeTempDir() {
    return fs.mkdtempSync(
        path.join(os.tmpdir(), "neu-builder-deb-validator-")
    );
}

describe(
    "DEB Validator",
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
        });

        it(
            "should fail when configuration is missing",
            () => {
                assert.throws(
                    () => validateDeb(),
                    /Missing DEB configuration/
                );
            }
        );

        it(
            "should fail when metadata is missing",
            () => {
                assert.throws(
                    () => validateDeb({}),
                    /Missing metadata configuration/
                );
            }
        );

        it(
            "should fail when metadata.applicationId is missing or blank",
            () => {
                assert.throws(
                    () => validateDeb({ metadata: {} }),
                    /metadata\.applicationId is required/
                );

                assert.throws(
                    () => validateDeb({
                        metadata: {
                            applicationId: "   "
                        }
                    }),
                    /metadata\.applicationId is required/
                );
            }
        );

        it(
            "should keep optional assets when they exist",
            () => {
                const iconPath = path.join(tempDir, "icon.png");
                const licensePath = path.join(tempDir, "LICENSE");

                fs.writeFileSync(iconPath, "icon");
                fs.writeFileSync(licensePath, "license");

                const config = validateDeb({
                    metadata: {
                        applicationId: "com.example.app"
                    },
                    assets: {
                        icon: iconPath,
                        license: licensePath
                    }
                });

                assert.strictEqual(config.assets.icon, iconPath);
                assert.strictEqual(config.assets.license, licensePath);
            }
        );

        it(
            "should resolve relative and slash-prefixed optional asset paths from cwd",
            () => {
                const previousCwd = process.cwd();
                const iconPath = path.join(tempDir, "assets", "icon.png");

                fs.mkdirSync(path.dirname(iconPath), {
                    recursive: true
                });
                fs.writeFileSync(iconPath, "icon");
                process.chdir(tempDir);

                try {
                    const config = validateDeb({
                        metadata: {
                            applicationId: "com.example.app"
                        },
                        assets: {
                            icon: "/assets/icon.png"
                        }
                    });

                    assert.strictEqual(config.assets.icon, iconPath);
                } finally {
                    process.chdir(previousCwd);
                }
            }
        );
        it(
            "should resolve existing maintainer scripts",
            () => {
                const postinstPath = path.join(tempDir, "postinst");

                fs.writeFileSync(postinstPath, "#!/bin/sh\n");

                const config = validateDeb({
                    metadata: {
                        applicationId: "com.example.app"
                    },
                    maintainerScripts: {
                        postinst: postinstPath
                    }
                });

                assert.strictEqual(
                    config.maintainerScripts.postinst,
                    postinstPath
                );
            }
        );
    }
);
