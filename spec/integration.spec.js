const assert = require("assert");

describe("CLI Plugin Integration", () => {
    const plugin = require("../index.js");

    it("should export correct command name", () => {
        assert.strictEqual(plugin.command, "builder");
    });

    it("should export a register function", () => {
        assert.strictEqual(typeof plugin.register, "function");
    });

    it("should register builder command with description and action", () => {
        let registeredDescription = null;
        let actionCallback = null;

        const fakeCmd = {
            description(desc) {
                registeredDescription = desc;
                return this;
            },
            arguments() {
                return this;
            },
            allowUnknownOption() {
                return this;
            },
            action(cb) {
                actionCallback = cb;
                return this;
            }
        };

        plugin.register(fakeCmd);

        assert.ok(registeredDescription.includes("installer"));
        assert.strictEqual(typeof actionCallback, "function");
    });
});