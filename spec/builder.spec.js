const assert = require("assert");
const fs = require("fs");
const path = require("path");

const stagingManager = require("../lib/stagingmanager");

const DIST_DIR = path.join(process.cwd(), "dist");
const APP_DIST_DIR = path.join(DIST_DIR, "app");

const STAGING_DIR = path.join(process.cwd(), ".neu-builder-staging");

function createDist() {
    fs.mkdirSync(APP_DIST_DIR, { recursive: true });
}

function createBinary(name = "app-linux_x64") {
    fs.writeFileSync(path.join(APP_DIST_DIR, name), "dummy");
}

function createResources() {
    fs.writeFileSync(path.join(APP_DIST_DIR, "resources.neu"), "dummy");
}

function createConfig(overrides = {}) {
    return {
        targetPlatform: "linux",
        metadata: {},
        ...overrides
    };
}

describe(
    "Staging Manager",
    () => {

        afterEach(() => {

            fs.rmSync(
                DIST_DIR,
                {
                    recursive: true,
                    force: true
                }
            );

            fs.rmSync(
                STAGING_DIR,
                {
                    recursive: true,
                    force: true
                }
            );
        });

        it(
            "should fail when dist directory is missing",
            () => {

                assert.throws(
                    () => {
                        stagingManager.prepare(createConfig({
                            buildType: "binary"
                        }));
                    },
                    /dist\/ directory not found/
                );
            }
        );

        it(
            "should fail when resources.neu is missing",
            () => {

                createDist();
                createBinary();

                assert.throws(
                    () => {
                        stagingManager.prepare(createConfig({
                            buildType: "binary"
                        }));
                    },
                    /No application output folder found/
                );
            }
        );

        it(
            "should fail when binary is missing",
            () => {

                createDist();
                createResources();

                assert.throws(
                    () => {
                        stagingManager.prepare(createConfig({
                            buildType: "binary"
                        }));
                    },
                    /Unable to locate Neutralino binary/
                );
            }
        );

        it(
            "should fail when multiple binaries exist",
            () => {

                createDist();

                createBinary("app1-linux_x64");
                createBinary("app2-linux_x64");

                createResources();

                assert.throws(
                    () => {
                        stagingManager.prepare(createConfig({
                            buildType: "binary"
                        }));
                    },
                    /Multiple binaries matched/
                );
            }
        );

        it(
            "should prepare staging directory successfully",
            () => {

                createDist();

                createBinary();
                createResources();

                const stagingPath =
                    stagingManager.prepare(createConfig({
                        buildType: "binary"
                    }));

                assert.ok(
                    fs.existsSync(
                        stagingPath
                    )
                );
            }
        );

        it(
            "should allow SEA build without resources.neu",
            () => {

                createDist();
                createBinary();

                const stagingPath =
                    stagingManager.prepare(createConfig({
                        buildType: "sea"
                    }));

                assert.ok(
                    fs.existsSync(
                        stagingPath
                    )
                );
            }
        );
    }
);
