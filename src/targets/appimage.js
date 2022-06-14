const inquirer = require("inquirer");
const path = require("path");
const os = require("os");
const fs = require("fs");
const process = require("process");
const { execSync, spawn } = require("child_process");

const download = require("../modules/downloader");
const DesktopFile = require("../scripts/DesktopFile.js");
const desktopFile = new DesktopFile();

const utils = require("../utils.js");
const AppRun = require("../scripts/AppRun");
const appRun = new AppRun();

const osTempDir = path.join(os.tmpdir(), "appImage");
const tmpdir = path.join(process.cwd(), ".tmp");
const AppDir = path.join(tmpdir, "AppDir");
let appimageConfig;
let appimageTool;

const configObj = {
  build_ARCH: "",
  sys_ARCH: "",
  icon: "",
  appName: "",
  arch: "",
};

const buildAppimage = async (archList = ["x64", "arm64"], config) => {
  const findAppimage = (t) => t.target === "appimage";

  for (const key in archList) {
    const findArch = (t) => t.arch?.find((a) => a === archList[key]);

    appimageConfig = config.cli?.builder?.linux?.targets?.find(
      (findAppimage && findArch) || findAppimage
    );

    configObj.build_ARCH = archList[key];
    configObj.icon = config.modes.window.icon;
    configObj.appName = config.cli.binaryName;

    if (configObj.build_ARCH === "x64") configObj.arch = "x86_64";
    else if (configObj.build_ARCH === "arm64") configObj.arch = "aarch64";

    if (os.arch() === "x64") configObj.sys_ARCH = "x86_64";
    else if (os.arch() === "arm64") configObj.sys_ARCH = "aarch64";

    const appImage = `${configObj.appName}-${configObj.arch}.AppImage`;

    utils.log(`building ${appImage}...`);

    await buildAppDir();
    await getAppImageTool();
    await configureAppImage();

    try {
      execSync(`mv ${appImage} ${path.join(process.cwd(), "dist")}`);
    } catch (err) {
      utils.handleNoneFatalError(err.message);
    }
  }

  console.log("Built your appimage(s) successfully!! 🚀");
  console.log("check your dist folder");
  console.log("");
};

const buildAppDir = async () => {
  await createAppDir();
  configureAppDir();
};

const createAppDir = async () => {
  if (fs.existsSync(tmpdir)) {
    const answers = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: `A .tmp folder already exists in this dir would you like to overwrite it`,
        default: true,
      },
    ]);

    if (answers.overwrite) {
      utils.deleteResources(tmpdir);
    } else {
      console.log("closing...");
      process.exit(1);
    }
  }

  try {
    fs.mkdirSync(tmpdir);
    fs.mkdirSync(AppDir);
    fs.mkdirSync(path.join(AppDir, "usr"));
    fs.mkdirSync(path.join(AppDir, "usr", "bin"));
  } catch (err) {
    utils.handleFatalError(err.message, tmpdir);
  }
};

const configureAppDir = async () => {
  const { appName, build_ARCH } = configObj;

  const binary = path.join(
    process.cwd(),
    "dist",
    `${appName}`,
    `${appName}-linux_${build_ARCH}`
  );

  const resources = path.join(
    process.cwd(),
    "dist",
    `${appName}`,
    "resources.neu"
  );

  if (!appimageConfig?.icon)
    utils.warn("no icon inculded, a default neutralino icon will be used");

  try {
    execSync(
      `chmod 755 ${binary} && cp ${binary} ${path.join(AppDir, "usr", "bin")}`
    );
    execSync(`cp ${resources} ${path.join(AppDir, "usr", "bin")}`);
    execSync(
      `cp ${path.join(
        process.cwd(),
        appimageConfig?.icon || configObj.icon
      )} ${AppDir}`
    );
  } catch (err) {
    utils.handleFatalError(err.message, tmpdir);
  }

  buildDesktopFile();
  buildAppRun();
};

const buildDesktopFile = () => {
  const { appName, build_ARCH, icon } = configObj;

  const exec = `${appName}-linux_${build_ARCH}`;
  const appIcon = appimageConfig?.icon || icon;

  desktopFile.set({
    name: appName,
    exec: exec,
    icon: path.basename(appIcon, path.extname(appIcon)),
    type: appimageConfig?.type,
    categories: appimageConfig?.categories,
  });

  try {
    desktopFile.writeScript(path.join(AppDir), appName);
  } catch (err) {
    utils.handleFatalError(err.message, tmpdir);
  }
};

const buildAppRun = () => {
  const { appName, build_ARCH } = configObj;
  appRun.set(`/usr/bin/${appName}-linux_${build_ARCH}`);

  try {
    appRun.writeScript(AppDir);
  } catch (err) {
    utils.handleFatalError(err.message, tmpdir);
  }
};

const getAppImageTool = async () => {
  const { sys_ARCH } = configObj;
  const appimageSpec = `appimagetool-${sys_ARCH}.AppImage`;
  appimageTool = path.join(osTempDir, appimageSpec);
  fs;

  if (
    !fs.existsSync(path.join(process.cwd(), appimageSpec)) &&
    !fs.existsSync(appimageTool)
  ) {
    const appImageToolUrl = `https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-${sys_ARCH}.AppImage`;

    try {
      if (!fs.existsSync(osTempDir)) fs.mkdirSync(osTempDir);
      await download(appImageToolUrl, osTempDir);
    } catch (err) {
      utils.handleFatalError(err.message, tmpdir);
    }
  } else if (fs.existsSync(path.join(process.cwd(), appimageSpec))) {
    appimageTool = path.join(process.cwd(), appimageSpec);
  }

  try {
    execSync("chmod 777 " + appimageTool);
  } catch (err) {
    utils.handleFatalError(err.message, tmpdir);
  }
};

const configureAppImage = () => {
  const { arch } = configObj;

  return new Promise((resolve, reject) => {
    console.log(appimageTool);

    let child;
    try {
      child = spawn(`./${appimageTool}`, [AppDir], {
        env: { ARCH: arch },
      });
    } catch (err) {
      utils.error(err);
    }

    child.stderr.on("data", (data) => utils.log(`${data}`));
    child.stdout.on("data", (data) => utils.log(`${data}`));

    child.on("error", (err) => {
      reject(
        utils.handleFatalError(
          `${err}, this error orignated from the appimagetool`
        )
      );
    });

    child.on("exit", (code) => {
      utils.deleteResources(tmpdir);

      if (code !== 0) {
        reject(
          utils.handleFatalError(
            `process exited with code ${code}, this error orignated from the appimagetool`
          )
        );
      }

      resolve();
    });
  });
};

module.exports = buildAppimage;
