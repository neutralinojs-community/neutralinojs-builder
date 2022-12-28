import { join, basename, extname } from "path";
import { tmpdir as _tmpdir, arch as _arch } from "os";
import fs, { existsSync, mkdirSync } from "fs-extra";
import { cwd, exit } from "process";
import { execSync, spawn } from "child_process";
import * as inquirer from "inquirer";

import download from "../modules/downloader";
import DesktopFile, { AppImageConfig } from "../scripts/DesktopFile.js";
const desktopFile = new DesktopFile();

import {
  log,
  handleNoneFatalError,
  handleFatalError,
  deleteResources,
  warn,
  error as _error,
} from "../utils";
// @ts-ignore
import AppRun from "../scripts/AppRun";
const appRun = new AppRun();

const osTempDir = join(_tmpdir(), "appImage");
const tmpdir = join(cwd(), ".tmp");
const AppDir = join(tmpdir, "AppDir");

let appimageConfig: AppImageConfig;
let appimageTool: fs.PathLike;

const configObj = {
  build_ARCH: "",
  sys_ARCH: "",
  icon: "",
  appName: "",
  arch: "",
};

const buildAppimage = async (
  archList = ["x64", "arm64"],
  config: BuildConfig
) => {
  const findAppimage = (t: Partial<BuildConfig>) => t.target === "appimage";

  for (const key in archList) {
    const findArch = (t: Partial<BuildConfig>) =>
      t.arch?.find((a: string) => a === archList[key]);

    appimageConfig = config.cli?.builder?.linux?.targets?.find(
      (t: Array<Record<string, any>>) =>
        (findAppimage(t) && findArch(t)) || findAppimage(t)
    );

    configObj.build_ARCH = archList[key];
    configObj.icon = config.modes.window.icon;
    configObj.appName = config.cli.binaryName;

    if (configObj.build_ARCH === "x64") configObj.arch = "x86_64";
    else if (configObj.build_ARCH === "arm64") configObj.arch = "aarch64";

    if (_arch() === "x64") configObj.sys_ARCH = "x86_64";
    else if (_arch() === "arm64") configObj.sys_ARCH = "aarch64";

    const appImage = `${configObj.appName}-${configObj.arch}.AppImage`;

    log(`building ${appImage}...`);

    await buildAppDir();
    await getAppImageTool();
    await configureAppImage();

    try {
      execSync(`mv ${appImage} ${join(cwd(), "dist")}`);
    } catch (err: any) {
      handleNoneFatalError(err.message);
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
  if (!existsSync(tmpdir)) {
    try {
      mkdirSync(tmpdir);
    } catch (error: any) {
      handleFatalError(error.message);
    }
  }

  if (existsSync(AppDir)) {
    const answers = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: `An AppDir folder already exists in your .tmp dir would you like to overwrite it`,
        default: true,
      },
    ]);

    if (answers.overwrite) {
      deleteResources(AppDir);
    } else {
      console.log("closing...");
      exit(1);
    }
  }

  try {
    mkdirSync(join(AppDir, "usr", "bin"), { recursive: true });
  } catch (err: any) {
    handleFatalError(err.message, AppDir);
  }
};

const configureAppDir = async () => {
  const { appName, build_ARCH } = configObj;

  const binary = join(
    cwd(),
    "dist",
    `${appName}`,
    `${appName}-linux_${build_ARCH}`
  );

  const resources = join(cwd(), "dist", `${appName}`, "resources.neu");

  if (!appimageConfig?.icon)
    warn("no icon inculded, a default neutralino icon will be used");

  try {
    execSync(
      `chmod 755 ${binary} && cp ${binary} ${join(AppDir, "usr", "bin")}`
    );
    execSync(`cp ${resources} ${join(AppDir, "usr", "bin")}`);
    execSync(
      `cp ${join(cwd(), appimageConfig?.icon || configObj.icon)} ${AppDir}`
    );
  } catch (err: any) {
    handleFatalError(err.message, AppDir);
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
    icon: basename(appIcon, extname(appIcon)),
    type: appimageConfig?.type,
    categories: appimageConfig?.categories,
  });

  try {
    desktopFile.writeScript(join(AppDir), appName);
  } catch (err: any) {
    handleFatalError(err.message, AppDir);
  }
};

const buildAppRun = () => {
  const { appName, build_ARCH } = configObj;
  appRun.set(`/usr/bin/${appName}-linux_${build_ARCH}`);

  try {
    appRun.writeScript(AppDir);
  } catch (err: any) {
    handleFatalError(err.message, AppDir);
  }
};

const getAppImageTool = async () => {
  const { sys_ARCH } = configObj;
  const appimageSpec = `appimagetool-${sys_ARCH}.AppImage`;
  appimageTool = join(osTempDir, appimageSpec);
  fs;

  if (!existsSync(join(cwd(), appimageSpec)) && !existsSync(appimageTool)) {
    const appImageToolUrl = `https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-${sys_ARCH}.AppImage`;

    try {
      if (!existsSync(osTempDir)) mkdirSync(osTempDir);
      await download(appImageToolUrl, osTempDir);
    } catch (err: any) {
      handleFatalError(err.message, AppDir);
    }
  } else if (existsSync(join(cwd(), appimageSpec))) {
    appimageTool = join(cwd(), appimageSpec);
  }

  try {
    execSync("chmod 777 " + appimageTool);
  } catch (err: any) {
    handleFatalError(err.message, AppDir);
  }
};

const configureAppImage = async () => {
  const { arch } = configObj;

  console.log(appimageTool);

  let child;
  try {
    child = spawn(`${appimageTool}`, [AppDir], {
      env: { ARCH: arch },
    });
  } catch (err: any) {
    _error(err);
  }

  if (!child) {
    _error(`Could not spawn ${appimageTool} process`);
    process.exit(1);
  }

  child.stderr.on("data", (data) => log(`${data}`));
  child.stdout.on("data", (data) => log(`${data}`));

  child.on("error", (err) => {
    handleFatalError(`${err}, this error orignated from the appimagetool`);
  });

  child.on("exit", (code) => {
    deleteResources(AppDir);

    if (code !== 0) {
      handleFatalError(
        `process exited with code ${code}, this error orignated from the appimagetool`
      );
    }
  });
};

export default buildAppimage;
