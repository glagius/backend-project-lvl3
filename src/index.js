// @ts-check
import cheerio from 'cheerio';
import path from 'path';
import {
  save,
  createPageFilename,
  getDataFromURL,
  createAssetsDirectory,
  isAbsolutePath,
  strToFilename,
  appLogger,
} from './utils.js';

/**
 * Saves files from "url" to "dirpath" directory
 * @param {string} url
 * @param {string} dirpath
 */
export default (url, dirpath) => {
  appLogger('Running');
  try {
    if (!/http.*/.test(url)) {
      throw new Error(`Wrong url format: ${url}`);
    }
    if (!dirpath) {
      throw new Error(`Wrong path for directory: ${dirpath}`);
    }
    const address = new URL(url);
    const page = {
      name: null,
      dirpath: null,
      content: null,
      resourses: [],
      resourcesDir: null,
    };

    return getDataFromURL(address.href)
      .then((value) => {
        // TODO: Add path parser for included files
        // 0 - создать директорию для файлов. - DONE
        // 1 - Разбить документы на элементы (скрипты, картинки, стили).
        // 2 - Каждый элемент загрузить отдельно, создав ему адрес пути и имя файла.
        // 3 - После каждого сохранения, вернуть модифицированный адрес
        // 4 - Собрать новый документ.
        page.name = createPageFilename(address);
        page.dirpath = `${dirpath}/${page.name}.html`;
        page.content = cheerio.load(value);

        const shouldSaveResource = (link) => {
          if (!/(png|css|js)$/.test(link)) {
            return false;
          }
          if (!isAbsolutePath(link) && !link.includes(address.origin)) {
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
        appLogger('Created assets directory: %o', directory);
        const modifyLink = (link) => (isAbsolutePath(link) ? `${address.origin}${link}` : link);
        const promises = page.resourses
          .map(({ link }) => {
            appLogger('Save resource from: %o', link);
            return getDataFromURL(modifyLink(link), 'arraybuffer');
          });
        return Promise.all(promises);
      })
      .then((results) => page.resourses.map(({ link }, index) => {
        const filepath = `${page.resourcesDir}/${strToFilename(link, address.host)}`;
        return save(filepath, results[index]);
      }))
      .then((resources) => Promise.all(resources))
      .then(() => page.resourses.forEach(({ tag, attr, link }) => {
        const relativeFolder = page.resourcesDir.split(path.sep).reverse()[0];
        const filepath = `${relativeFolder}/${strToFilename(link, address.host)}`;
        page.content(`${tag}[${attr}=${link}]`).attr(attr, filepath);
      }))
      .then(() => save(page.dirpath, page.content.html()));
  } catch (error) {
    appLogger(error.message);
    return Promise.reject(error);
  }
};
