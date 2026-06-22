const assert = require("assert");
const fs = require("fs");
const path = require("path");

const stagingManager = require("../lib/stagingmanager");

const DIST_DIR = path.join(process.cwd(), "dist");

const STAGING_DIR = path.join(process.cwd(), ".neu-builder-staging");

function createDist() {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}

function createBinary(name = "app") {
    fs.writeFileSync(path.join(DIST_DIR, name), "dummy");
}

function createResources() {
    fs.writeFileSync(path.join(DIST_DIR, "resources.neu"), "dummy");
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
                        stagingManager.prepare({
                            buildType: "binary"
                        });
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
                        stagingManager.prepare({
                            buildType: "binary"
                        });
                    },
                    /resources\.neu not found/
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
                        stagingManager.prepare({
                            buildType: "binary"
                        });
                    },
                    /Unable to locate Neutralino binary/
                );
            }
        );

        it(
            "should fail when multiple binaries exist",
            () => {

                createDist();

                createBinary("app1");
                createBinary("app2");

                createResources();

                assert.throws(
                    () => {
                        stagingManager.prepare({
                            buildType: "binary"
                        });
                    },
                    /Multiple binaries found/
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
                    stagingManager.prepare({
                        buildType: "binary"
                    });

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
                    stagingManager.prepare({
                        buildType: "sea"
                    });

                assert.ok(
                    fs.existsSync(
                        stagingPath
                    )
                );
            }
        );
    }
);