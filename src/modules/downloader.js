const { DownloaderHelper } = require("node-downloader-helper");
const ora = require("ora");
const path = require("path");
const inquirer = require("inquirer");
const utils = require("../utils");

const download = async (url, writePath, appName = undefined) => {
  let downloadUrl;
  try {
    downloadUrl = new URL(url);
  } catch (err) {
    utils.handleFatalError(err.message);
  }

  const spinner = ora("");
  const dl = new DownloaderHelper(url, writePath);

  const app = await dl.getTotalSize();
  await getUserConsent(app, downloadUrl.protocol);

  const name = appName || app.name;

  const timeout = checkTimeOut(
    "The download process timed out, please check your internet connection",
    path.join(writePath, name)
  );

  dl.on("stateChanged", (state) => {
    if (state === "STARTED")
      utils.log(`connecting to ${downloadUrl.hostname}...`);

    if (state === "DOWNLOADING") {
      timeout.ref();
    }
  });

  dl.on("progress", ({ progress, speed }) => {
    timeout.refresh();

    if (!spinner.isSpinning) spinner.start();
    spinner.text = `Downloading ${name} from ${
      downloadUrl.hostname
    } ${progress.toFixed(0)}% | ${speed}b/s`;
  });

  dl.once("error", (err) => {
    spinner.stop();
    utils.handleFatalError(err.message);
  });

  dl.on("warning", (err) => {
    spinner.stop();
    utils.warn(err.message);
  });

  dl.once("end", (stats) => {
    timeout.unref();

    spinner.stop();
    dl.removeAllListeners();
    return stats;
  });

  await dl.start();
};

const checkTimeOut = (message, resource) => {
  const timeout = setTimeout(() => {
    utils.handleFatalError(message, resource);
  }, 8000);

  timeout.unref();

  return timeout;
};

const getUserConsent = async (app, protocol) => {
  const alertNotHTTPSProtocol =
    protocol !== "https:" && protocol !== "https"
      ? `The protocol being  used is ${protocol}. Make sure you trust this connection`
      : "";

  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "download",
      message: `You need to dowload ${app.name}, It will use up ${(
        app.total / 1000000
      ).toFixed(3)}mb. ${alertNotHTTPSProtocol}`,
    },
  ]);

  if (answers.download) {
    return true;
  } else {
    utils.handleFatalError("user terminated the process");
  }
};

module.exports = download;
