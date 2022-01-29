// @ts-check
import cheerio from 'cheerio';
import path from 'path';
import Listr from 'listr';
import {
  save,
  createPageFilename,
  getDataFromURL,
  createAssetsDirectory,
  isAbsolutePath,
  strToFilename,
} from './utils.js';

/**
 * Saves files from "url" to "dirpath" directory
 * @param {string} url
 * @param {string} dirpath
 */
export default (url, dirpath, logger) => {
  logger('Application running');
  if (!/http.*/.test(url)) {
    return Promise.reject(new URIError(`Wrong url format: ${url}`));
  }
  const location = new URL(url);
  const page = {
    name: null,
    dirpath: null,
    content: null,
    resourses: [],
    resourcesDir: null,
  };

  logger('Save resource from : %s', location.href);

  return getDataFromURL(location.href)
    .then((value) => {
      page.name = createPageFilename(location);
      page.dirpath = `${dirpath}/${page.name}.html`;
      page.content = cheerio.load(value);

      const shouldSaveResource = (link) => {
        if (!isAbsolutePath(link) && !link.includes(location.origin)) {
          return false;
        }
        return true;
      };

      const tags = ['img', 'link', 'script'];
      const attributesMapping = {
        img: 'src',
        link: 'href',
        script: 'src',
      };

      tags.forEach((tag) => {
        const attribute = attributesMapping[tag];
        page.content(tag)
          .filter((_ind, el) => shouldSaveResource(page.content(el).attr(attribute)))
          .each((_ind, el) => {
            const link = page.content(el).attr(attribute);
            page.resourses.push({ tag, attr: attribute, link });
          });
      });
      return createAssetsDirectory(dirpath, page.name);
    })
    .then((directory) => {
      page.resourcesDir = directory;

      logger('Created assets directory: %o', directory);
      const modifiedLink = (link) => (isAbsolutePath(link) ? `${location.origin}${link}` : link);
      const assets = new Map();

      page.resourses.forEach(({ link }) => assets.set(link, null));

      const tasks = page.resourses.map(({ link }) => ({
        title: `Downloading resource for: ${link}`,
        task: () => getDataFromURL(modifiedLink(link)).then((data) => assets.set(link, data)),
      }));
      const queue = new Listr(tasks, { concurrent: true });

      return queue.run().then(() => assets);
    })
    .then((assets) => {
      logger('Saved assets: %o', assets);
      const promises = page.resourses.map(({ link }) => {
        const filepath = `${page.resourcesDir}/${strToFilename(link, location.host)}`;
        return save(filepath, assets.get(link));
      });
      return Promise.all(promises);
    })
    .then(() => {
      page.resourses.forEach(({ tag, attr, link }) => {
        const relativeFolder = page.resourcesDir.split(path.sep).reverse()[0];
        const filepath = `${relativeFolder}/${strToFilename(link, location.host)}`;
        page.content(`${tag}[${attr}=${link}]`).attr(attr, filepath);
      });
      return save(page.dirpath, page.content.html());
    });
};
