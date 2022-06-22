const path = require("path");
const { execSync } = require("child_process");
const fs = require("fs");

class AppRun {
  #self = "";
  #here = "";
  #exec = "";
  #execPath = "";

  set(execPath) {
    this.#self = `$(readlink -f "$0")`;
    this.#here = "${SELF%/*}";
    this.#exec = "${HERE}" + execPath;
    this.#execPath = "${EXEC}";
  }

  get() {
    return {
      self: this.#self,
      here: this.#here,
      exec: this.#exec,
      execPath: this.#execPath,
    };
  }

  writeScript(writePath) {
    const src = this.get();

    fs.writeFileSync(
      path.join(writePath, "AppRun"),
      `#!/bin/sh ${Object.keys(src)
        .map((key) => "\n" + key.toUpperCase() + "=" + src[key])
        .join("")} \nexec  ${this.#exec}`
    );

    execSync("chmod 777 " + path.join(writePath, "AppRun"));
  }
}

module.exports = AppRun;
