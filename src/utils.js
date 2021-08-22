// @ts-check
import axios from 'axios';
import { appendFile, mkdir } from 'fs/promises';
import path from 'path';

const dasherize = (str) => str.replace(/\W/g, '-');
const createFilename = (str) => str.replace(/\//gi, '-');
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
/**
 * Converts 'https://ru.hexlet.io/packs/js/runtime.js' to filename
 * @param {string} str - path to remote file.
 * @param {string} domain - web-site domain name.
 * @returns {string}
 */
const strToFilename = (str, domain) => {
  if (isFullLink(str)) {
    const address = new URL(str);
    const { pathname, hash } = address;
    const modifiedDomain = dasherize(domain);
    return createFilename(`${modifiedDomain}${pathname}${hash}`);
  }
  const rx = /\/\w+\S+/gi;
  const modifiedDomain = dasherize(domain);
  const trimmedAssetsPath = str.match(rx)[0];
  return createFilename(`${modifiedDomain}${trimmedAssetsPath}`);
};

/**
* Request data from address
* @param {string} url - valid url for data
* @param {('json' | 'text' | 'stream' | 'arraybuffer')=} responseType - one of axios types
*/
const getDataFromURL = (url, responseType = 'json') => axios({ method: 'get', url, responseType })
  .then((res) => res.data);

/**
   * Saves file in given directory
   * @param {string} filepath - directory for file
   * @param {string} data - resources to save.
   */
const save = (filepath, data) => appendFile(filepath, data)
  .then(() => filepath);

/**
 * Create directory for assets
 * @param {string} dirPath - path where create new directory
 * @param {string} pagename - modified web-page name
 * @returns {Promise}    - filepath to directory
 */
const createAssetsDirectory = (dirPath, pagename) => {
  const address = `${dirPath}/${pagename}_files`;
  return mkdir(address).then(() => address);
};

export {
  getDataFromURL, save, strToFilename, createPageFilename, createAssetsDirectory, isAbsolutePath,
};
