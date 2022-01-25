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
export default (url, dirpath, log) => {
  log('Running');
  try {
    if (!/http.*/.test(url)) {
      throw new URIError(`Wrong url format: ${url}`);
    }
    const location = new URL(url);

    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      throw new URIError('Expects remote host');
    }
    const page = {
      name: null,
      dirpath: null,
      content: null,
      resourses: [],
      resourcesDir: null,
    };

    return getDataFromURL(location.href)
      .then((value) => {
        // TODO: Add path parser for included files
        // 0 - создать директорию для файлов. - DONE
        // 1 - Разбить документы на элементы (скрипты, картинки, стили).
        // 2 - Каждый элемент загрузить отдельно, создав ему адрес пути и имя файла.
        // 3 - После каждого сохранения, вернуть модифицированный адрес
        // 4 - Собрать новый документ.
        page.name = createPageFilename(location);
        page.dirpath = `${dirpath}/${page.name}.html`;
        page.content = cheerio.load(value);

        const shouldSaveResource = (link) => {
          if (!isAbsolutePath(link) && !link.includes(location.origin)) {
            return false;
          }
          return true;
        };

        page.content('img')
          .filter((_ind, el) => shouldSaveResource(page.content(el).attr('src')))
          .each((_ind, el) => {
            const link = page.content(el).attr('src');
            page.resourses.push({ tag: 'img', attr: 'src', link });
          });

        page.content('link')
          .filter((_ind, el) => shouldSaveResource(page.content(el).attr('href')))
          .each((_ind, el) => {
            const link = page.content(el).attr('href');
            page.resourses.push({ tag: 'link', attr: 'href', link });
          });

        page.content('script')
          .filter((_ind, el) => shouldSaveResource(page.content(el).attr('src')))
          .each((_ind, el) => {
            const link = page.content(el).attr('src');
            page.resourses.push({ tag: 'script', attr: 'src', link });
          });
        return createAssetsDirectory(dirpath, page.name);
      })
      .then((directory) => {
        page.resourcesDir = directory;

        log('Created assets directory: %o', directory);
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
        log('Saved assets: %o', assets);
        return page.resourses.map(({ link }) => {
          const filepath = `${page.resourcesDir}/${strToFilename(link, location.host)}`;
          return save(filepath, assets.get(link));
        });
      })
      .then((resources) => Promise.all(resources))
      .then(() => page.resourses.forEach(({ tag, attr, link }) => {
        const relativeFolder = page.resourcesDir.split(path.sep).reverse()[0];
        const filepath = `${relativeFolder}/${strToFilename(link, location.host)}`;
        page.content(`${tag}[${attr}=${link}]`).attr(attr, filepath);
      }))
      .then(() => save(page.dirpath, page.content.html()));
  } catch (error) {
    log(error.message);
    return Promise.reject(error);
  }
};
