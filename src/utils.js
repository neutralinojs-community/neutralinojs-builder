const fs = require("fs");
const chalk = require("chalk");

const error = (message) => {
  console.error(`neu builder: ${chalk.bgRed.black("ERROR")} ${message}`);
};

const log = (message) => {
  console.log(`neu builder: ${chalk.bgGreen.black("INFO")} ${message}`);
};

const warn = (message) => {
  console.warn(`neu builder: ${chalk.bgYellow.black("WARNING")} ${message}`);
};

const isNeutralinojsProject = (CONFIG_FILE) => {
  return fs.existsSync(CONFIG_FILE);
};

const checkCurrentProject = (CONFIG_FILE) => {
  if (!isNeutralinojsProject(CONFIG_FILE)) {
    error(
      `Unable to find ${CONFIG_FILE}. ` +
        `Please check whether the current directory has a Neutralinojs project.`
    );
    process.exit(1);
  }
};

const findExt = (path, extension) => {
  let files = fs.readdirSync(path);
  return !!files.filter((file) =>
    file.match(new RegExp(`.*\.(${extension})`, "ig"))
  );
};

const deleteResources = (resource) => {
  return fs.rmSync(resource, { recursive: true, force: true });
};

const handleFatalError = (message, resource = undefined) => {
  if (!message) return;
  error(`${message}`);

  if (resource) deleteResources(resource);

  process.exit(1);
};

const handleNoneFatalError = (message, resource = undefined) => {
  if (!message) return;
  error(`${message}`);

  if (resource) deleteResources(resource);
};

module.exports = {
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
