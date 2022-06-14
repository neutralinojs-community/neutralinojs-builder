const process = require("process");
const path = require("path");
const fs = require("fs");
const utils = require("./utils");

const buildAppimage = require("./targets/appimage.js");

let neuModules;

module.exports = {
  command: "builder [target]",
  register: (command, modules) => {
    command
      .description("builds installers for your Neutalinojs app")
      .option("--x64", "x64 or x86 amd/intel architecture")
      .option("--arm64", "arm64 architecture")
      .action(async (target, command) => {
        neuModules = modules;
        // bundle the app
        if (
          !fs.existsSync(
            path.join(
              process.cwd(),
              "dist",
              modules.config.get().cli.binaryName
            )
          )
        ) {
          await modules.bundler.bundleApp(true);
        }

        // build installer
        if (!target) {
          // if the no target, get from neutralino.config.json
          const builderOptions = neuModules.config.get()?.cli?.builder;
          const operatingSys = Object.keys(builderOptions);

          if (!operatingSys) utils.handleFatalError("Please Specify a target");

          for (const os in operatingSys) {
            const targets = builderOptions[`${operatingSys[os]}`]?.targets;

            switch (operatingSys[os]) {
              case "linux":
                await buildForLinux(targets);
                break;

              case "win":
                // enter code to build windows installers
                break;
              case "mac":
                // enter code to build macOS installers
                break;

              default:
                utils.handleNoneFatalError(
                  `${operatingSys[os]} is not supported by Neutralinojs Builder`
                );
                break;
            }
          }
        } else {
          // if target, get target and arch from command
          const buildObj = {
            target,
            arch: Object.keys(command).length
              ? Object.keys(command)
              : undefined,
          };

          if (target === "appimage") {
            await buildForLinux([buildObj]);
          }
        }

        process.exit(1);
      });
  },
};

const buildForLinux = async (targets = []) => {
  for (const t in targets) {
    switch (targets[t].target) {
      case "appimage":
        await buildAppimage(targets[t].arch, neuModules.config.get());
        break;

      case "deb":
        console.log("building for deb");
        break;

      default:
        utils.handleNoneFatalError(
          `${targets[t].target} is not supported by Neutralinojs Builder`
        );
        break;
    }
  }
};
