import { DownloaderHelper } from "node-downloader-helper";
import ora from "ora";
import { join } from "path";
import { prompt } from "inquirer";
import { error, handleFatalError, log, warn } from "../utils";
import { PathLike } from "fs";
import { URL } from "url";

const download = async (url: string, writePath: PathLike, appName?: string) => {
  try {
    let downloadUrl = new URL(url);

    if (!download) {
      error("Resourse download path not present");
      process.exit(1);
    }

    const spinner = ora("");
    const dl = new DownloaderHelper(url, writePath.toString());

    const app = await dl.getTotalSize();
    await getUserConsent(app, downloadUrl.protocol);

    const name = appName || app.name;

    const timeout = checkTimeOut(
      "The download process timed out, please check your internet connection",
      join(writePath as string, name)
    );

    dl.on("stateChanged", (state) => {
      if (state === "STARTED") log(`connecting to ${downloadUrl.hostname}...`);

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
      handleFatalError(err.message);
    });

    dl.on("warning", (err) => {
      spinner.stop();
      warn(err.message);
    });

    dl.once("end", (stats) => {
      timeout.unref();

      spinner.stop();
      dl.removeAllListeners();
      return stats;
    });

    await dl.start();
  } catch (error: any) {
    handleFatalError(error.message);
  }
};

const checkTimeOut = (message: string, resource: string) => {
  const timeout = setTimeout(() => {
    handleFatalError(message, resource);
  }, 8000);

  timeout.unref();

  return timeout;
};

const getUserConsent = async (
  app: { name: string; total: number | null },
  protocol: string
) => {
  const alertNotHTTPSProtocol =
    protocol !== "https:" && protocol !== "https"
      ? `The protocol being  used is ${protocol}. Make sure you trust this connection`
      : "";

  const answers = await prompt([
    {
      type: "confirm",
      name: "download",
      message: `You need to dowload ${app.name}, It will use up ${(
        (app.total ?? 0) / 1000000
      ).toFixed(3)}mb. ${alertNotHTTPSProtocol}`,
    },
  ]);

  if (answers.download) {
    return true;
  } else {
    handleFatalError("user terminated the process");
  }
};

export default download;
