// @ts-check
import axios from 'axios';
import { appendFile, mkdir } from 'fs/promises';
import path from 'path';

const dasherize = (str) => str.replace(/\W$/g, '').replace(/\W/g, '-');
const modifyFilePath = (str) => str.replace(/\//gi, '-');

/**
 * Converts 'https://some.domain.name/pathname' to format 'some-domain-name-pathname'
 * @param {URL} address
 * @returns {string}
 */
const createPageFilename = (address) => {
  const { host, pathname, hash } = address;
  return dasherize(`${host}${pathname}${hash}`);
};

/**
 * Is full link given
 * @param {string} link
 * @returns {boolean}
 */
const isFullLink = (link) => {
  try {
    const address = new URL(link);
    return !!address;
  } catch {
    return false;
  }
};

/**
 * Checker for filepath
 * @param {string} link
 * @returns {boolean}
*/
const isAbsolutePath = (link) => path.isAbsolute(link);

const isBinaryFilePath = (link) => /(png|css|js)$/.test(link);
/**
 * Converts 'https://ru.hexlet.io/packs/js/runtime.js' to filename
 * @param {string} str - path to remote file.
 * @param {string} domain - web-site domain name.
 * @returns {string}
 */
const strToFilename = (str, domain) => {
  let filepath;
  if (isFullLink(str)) {
    const address = new URL(str);
    const { pathname, hash } = address;
    const modifiedDomain = dasherize(domain);
    filepath = modifyFilePath(`${modifiedDomain}${pathname}${hash}`);
  } else {
    const rx = /\/\w+\S+/gi;
    const modifiedDomain = dasherize(domain);
    const trimmedAssetsPath = str.match(rx)[0];
    filepath = modifyFilePath(`${modifiedDomain}${trimmedAssetsPath}`);
  }
  return path.extname(filepath) ? filepath : `${filepath}.html`;
};

/**
* Request data from address
* @param {string} url - valid url for data
*/
const getDataFromURL = (url) => {
  const responseType = isBinaryFilePath(url) ? 'arraybuffer' : 'json';
  return axios({ method: 'get', url, responseType })
    .then((res) => res.data)
    .catch((err) => {
      throw new Error(`Failed to download resource from link: ${url} \n${err.message}`);
    });
};
/**
   * Saves file in given directory
   * @param {string} filepath - directory for file
   * @param {string} data - resources to save.
   */
const save = (filepath, data) => appendFile(filepath, data)
  .then(() => filepath)
  .catch((err) => {
    throw new Error(`Failed to save data for filepath: ${filepath} \n${err.message}`);
  });

/**
 * Create directory for assets
 * @param {string} dirPath - path where create new directory
 * @param {string} pagename - modified web-page name
 * @returns {Promise}    - filepath to directory
 */
const createAssetsDirectory = (dirPath, pagename) => {
  const address = `${dirPath}/${pagename}_files`;
  return mkdir(address).then(() => address)
    .catch((err) => {
      throw new Error(`Failed to create assets directory in: ${dirPath} \n${err.message}`);
    });
};

export {
  getDataFromURL,
  save,
  strToFilename,
  createPageFilename,
  createAssetsDirectory,
  isAbsolutePath,
};
