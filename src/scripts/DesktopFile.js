const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

class DesktopFile {
  #name = "";
  #exec = "";
  #icon = "";
  #type = "";
  #categories = "";

  set({ name, exec, icon, type, categories }) {
    this.#name = name;
    this.#exec = exec;
    this.#icon = icon;
    this.#type = type || "Application";
    this.#categories = categories || "Utility";
  }

  get() {
    return {
      name: this.#name,
      exec: this.#exec,
      icon: this.#icon,
      type: this.#type,
      categories: this.#categories,
    };
  }

  writeScript(writePath, appName) {
    const src = this.get();
    const desktopFile = path.join(writePath, `${appName}.desktop`);

    fs.writeFileSync(
      desktopFile,
      "[Desktop Entry]" +
        `${Object.keys(src)
          .map((k) => {
            const key = k.charAt(0).toUpperCase() + k.slice(1);

            return "\n" + key + "=" + src[k];
          })
          .join("")}`
    );

    execSync("chmod 777 " + desktopFile);
  }
}

module.exports = DesktopFile;
