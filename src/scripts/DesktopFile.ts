const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

export type AppImageConfig = {
  name: string;
  exec: string;
  icon: string;
  type: string;
  categories: string;
};

export default class DesktopFile {
  private name = "";
  private exec = "";
  private icon = "";
  private type = "";
  private categories = "";

  set({ name, exec, icon, type, categories }: AppImageConfig) {
    this.name = name;
    this.exec = exec;
    this.icon = icon;
    this.type = type || "Application";
    this.categories = categories || "Utility";
  }

  get() {
    return {
      name: this.name,
      exec: this.exec,
      icon: this.icon,
      type: this.type,
      categories: this.categories,
    };
  }

  writeScript(writePath: string, appName: string) {
    const src = this.get();
    const desktopFile = path.join(writePath, `${appName}.desktop`);

    fs.writeFileSync(
      desktopFile,
      "[Desktop Entry]" +
        `${Object.keys(src)
          .map((k) => {
            const key = k.charAt(0).toUpperCase() + k.slice(1);

            return "\n" + key + "=" + src[k as keyof AppImageConfig];
          })
          .join("")}`
    );

    execSync("chmod 777 " + desktopFile);
  }
}
