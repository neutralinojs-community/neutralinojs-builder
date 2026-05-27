const chalk = require('chalk');

const formatMsg = (msg) => typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg;

let info = (msg) => console.log(`neu: ${chalk.bgGreen.black('INFO')} ${formatMsg(msg)}`);
let warn = (msg) => console.warn(`neu: ${chalk.bgYellow.black('WARN')} ${formatMsg(msg)}`);
let error = (msg) => console.error(`neu: ${chalk.bgRed.black('ERRR')} ${formatMsg(msg)}`);
let debug = (msg) => {
    if (process.env.DEBUG) {
        console.log(`neu: ${chalk.bgMagenta.white('DEBG')} ${formatMsg(msg)}`);
    }
};

module.exports = {
    info,
    warn,
    error,
    debug
};