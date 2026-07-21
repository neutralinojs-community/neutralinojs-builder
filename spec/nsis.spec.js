const assert = require("assert");
const path = require("path");
const fs = require("fs");
const { validateNsis } = require("../targets/nsis/nsisvalidator");

describe("NSIS Validator", () => {

    it("should throw error when metadata is missing", () => {
        assert.throws(() => {
            validateNsis({});
        }, /Missing metadata/);
    });

    it("should throw error when applicationId is missing", () => {
        assert.throws(() => {
            validateNsis({
                metadata: {},
                assets: {}
            });
        }, /applicationId is required/);
    });

    it("should throw error when required icon asset is missing", () => {
        assert.throws(() => {
            validateNsis({
                metadata: { applicationId: "com.example.app" },
                assets: {}
            });
        }, /icon.*missing/i);
    });

    it("should throw error when icon file does not exist", () => {
        const fakePath = path.join(process.cwd(), "nonexistent-app-icon.ico");
        assert.throws(() => {
            validateNsis({
                metadata: { applicationId: "com.example.app" },
                assets: { icon: fakePath }
            });
        }, /icon.*not found/i);
    });

    it("should pass validation when icon exists and optional assets are null", () => {
        const iconPath = path.join(process.cwd(), "test-icon.ico");
        fs.writeFileSync(iconPath, "dummy icon");

        try {
            assert.doesNotThrow(() => {
                validateNsis({
                    metadata: { applicationId: "com.example.app" },
                    assets: {
                        icon: iconPath,
                        license: null,
                        sidebarImage: null,
                        headerImage: null
                    }
                });
            });
        } finally {
            fs.rmSync(iconPath, { force: true });
        }
    });

});