const path = require("path");
const { execSync } = require("child_process");
const fs = require("fs");

export type AppRunConfig = {
  self: string;
  here: string;
  exec: string;
  execPath: string;
};

export default class AppRun {
  self = "";
  here = "";
  exec = "";
  execPath = "";

  set(execPath: string) {
    this.self = `$(readlink -f "$0")`;
    this.here = "${SELF%/*}";
    this.exec = "${HERE}" + execPath;
    this.execPath = "${EXEC}";
  }

  get() {
    return {
      self: this.self,
      here: this.here,
      exec: this.exec,
      execPath: this.execPath,
    };
  }

  writeScript(writePath: string) {
    const src = this.get();

    fs.writeFileSync(
      path.join(writePath, "AppRun"),
      `#!/bin/sh ${Object.keys(src)
        .map(
          (key) =>
            "\n" + key.toUpperCase() + "=" + src[key as keyof AppRunConfig]
        )
        .join("")} \nexec  ${this.exec}`
    );

    execSync("chmod 777 " + path.join(writePath, "AppRun"));
  }
}
