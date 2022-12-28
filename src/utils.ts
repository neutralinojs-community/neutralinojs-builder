import { PathLike } from "fs";
import fs from "fs";
import chalk from "chalk";

const error = (message: string) => {
  console.error(`neu builder: ${chalk.bgRed.black("ERROR")} ${message}`);
};

const log = (message: string) => {
  console.log(`neu builder: ${chalk.bgGreen.black("INFO")} ${message}`);
};

const warn = (message: string) => {
  console.warn(`neu builder: ${chalk.bgYellow.black("WARNING")} ${message}`);
};

const isNeutralinojsProject = (CONFIG_FILE: PathLike) => {
  return fs.existsSync(CONFIG_FILE);
};

const checkCurrentProject = (CONFIG_FILE: PathLike) => {
  if (!isNeutralinojsProject(CONFIG_FILE)) {
    error(
      `Unable to find ${CONFIG_FILE}. ` +
        `Please check whether the current directory has a Neutralinojs project.`
    );
    process.exit(1);
  }
};

const findExt = (path: PathLike, extension: string) => {
  let files = fs.readdirSync(path);
  return !!files.filter((file: string) =>
    file.match(new RegExp(`.*\.(${extension})`, "ig"))
  );
};

const deleteResources = (resource: PathLike) => {
  return fs.rmSync(resource, { recursive: true, force: true });
};

const handleFatalError = (message: string, resource = undefined) => {
  if (!message) return;
  error(`${message}`);

  if (resource) deleteResources(resource);

  process.exit(1);
};

const handleNoneFatalError = (message: string, resource = undefined) => {
  if (!message) return;
  error(`${message}`);

  if (resource) deleteResources(resource);
};

export default {
  error,
  log,
  warn,
  isNeutralinojsProject,
  checkCurrentProject,
  findExt,
  deleteResources,
  handleFatalError,
  handleNoneFatalError,
};
