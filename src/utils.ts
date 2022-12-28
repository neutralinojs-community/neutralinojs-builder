import { PathLike } from "fs";
import fs from "fs";
import chalk from "chalk";

export const error = (message: string) => {
  console.error(`neu builder: ${chalk.bgRed.black("ERROR")} ${message}`);
};

export const log = (message: string) => {
  console.log(`neu builder: ${chalk.bgGreen.black("INFO")} ${message}`);
};

export const warn = (message: string) => {
  console.warn(`neu builder: ${chalk.bgYellow.black("WARNING")} ${message}`);
};

export const isNeutralinojsProject = (CONFIG_FILE: PathLike) => {
  return fs.existsSync(CONFIG_FILE);
};

export const checkCurrentProject = (CONFIG_FILE: PathLike) => {
  if (!isNeutralinojsProject(CONFIG_FILE)) {
    error(
      `Unable to find ${CONFIG_FILE}. ` +
        `Please check whether the current directory has a Neutralinojs project.`
    );
    process.exit(1);
  }
};

export const findExt = (path: PathLike, extension: string) => {
  let files = fs.readdirSync(path);
  return !!files.filter((file: string) =>
    file.match(new RegExp(`.*\.(${extension})`, "ig"))
  );
};

export const deleteResources = (resource: PathLike) => {
  return fs.rmSync(resource, { recursive: true, force: true });
};

export const handleFatalError = (message: string, resource?: string) => {
  if (!message) return;
  error(`${message}`);

  if (resource) deleteResources(resource);

  process.exit(1);
};

export const handleNoneFatalError = (message: string, resource?: string) => {
  if (!message) return;
  error(`${message}`);

  if (resource) deleteResources(resource);
};
