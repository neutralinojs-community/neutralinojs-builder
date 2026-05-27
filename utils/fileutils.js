const fs = require('fs');
const path = require('path');
const logger = require('./logger');

let fileExists = (filePath) => {
    return fs.existsSync(filePath);
};

let ensureDirectory = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.debug(`Created directory: ${dirPath}`);
    }
};

let removeDirectory = (dirPath) => {
    try {
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
            logger.debug(`Removed: ${dirPath}`);
        }
    } catch (err) {
        logger.error(`Failed to remove: ${dirPath}`);
        throw err;
    }
};

let copyFile = (src, dest) => {
    try {
        fs.copyFileSync(src, dest);
        logger.debug(`Copied: ${src} → ${dest}`);
    } catch (err) {
        logger.error(`Failed to copy file: ${src}`);
        throw err;
    }
};

let copyDirectory = (src, dest) => {
    try {
        fs.cpSync(src, dest, { recursive: true });
        logger.debug(`Copied directory: ${src} → ${dest}`);
    } catch (err) {
        logger.error(`Failed to copy directory: ${src}`);
        throw err;
    }
};

let writeFile = (filePath, content) => {
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        logger.debug(`Written file: ${filePath}`);
    } catch (err) {
        logger.error(`Failed to write file: ${filePath}`);
        throw err;
    }
};

let readJSON = (filePath) => {
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        logger.error(`Failed to read JSON: ${filePath}`);
        throw err;
    }
};

let writeJSON = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        logger.debug(`Written JSON: ${filePath}`);
    } catch (err) {
        logger.error(`Failed to write JSON: ${filePath}`);
        throw err;
    }
};

let readTemplate = (templatePath) => {
    try {
        const fullPath = path.isAbsolute(templatePath)
            ? templatePath
            : path.resolve(__dirname, '../templates', templatePath);
        return fs.readFileSync(fullPath, 'utf-8');
    } catch (err) {
        logger.error(`Failed to read template: ${templatePath}`);
        throw err;
    }
};

let replacePlaceholders = (template, data) => {
    return Object.keys(data).reduce((result, key) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        return result.replace(placeholder, data[key] !== undefined ? data[key] : '');
    }, template);
};

let joinPath = (...args) => path.join(...args);

let getExtension = (filePath) => path.extname(filePath);

module.exports = {
    fileExists,
    ensureDirectory,
    removeDirectory,
    copyFile,
    copyDirectory,
    writeFile,
    readJSON,
    writeJSON,
    readTemplate,
    replacePlaceholders,
    joinPath,
    getExtension
};