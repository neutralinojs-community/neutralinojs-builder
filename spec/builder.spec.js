const assert = require("assert");
const path = require("path");
const fs = require("fs");

const stagingManager = require("../lib/stagingmanager");
const targetLoader = require("../lib/targetloader");

describe("Staging Manager", () => {
    it("should throw error if dist directory not found", () => {
        const config = {
            target: "nsis",
            arch: "x64"
        };
        assert.throws(() => {
            stagingManager.prepare(config);
        }, /dist\/ directory not found/);
    });

    it("should create staging directory", () => {
        const distDir = path.join(process.cwd(), "dist");
        fs.mkdirSync(distDir, { recursive: true });
        fs.writeFileSync(path.join(distDir, "test.exe"), "dummy");

        const config = { target: "nsis", arch: "x64" };
        const stagingPath = stagingManager.prepare(config);

        assert.ok(fs.existsSync(stagingPath));

        stagingManager.cleanup(stagingPath);
        fs.rmSync(distDir, { recursive: true, force: true });
    });
});

describe("Target Loader", () => {
    it("should throw error for invalid target", () => {
        assert.throws(() => {
            targetLoader.load("invalidtarget");
        }, /not found/);
    });
});