// @ts-check
import cheerio from 'cheerio';
import {
  save, createPageFilename, getDataFromURL, createAssetsDirectory, isAbsolutePath, strToFilename,
} from './src/utils';
/**
 * Saves files from "url" to "dirpath" directory
 * @param {string} url
 * @param {string} dirpath
 */
export default (url, dirpath) => {
  try {
    if (!/http.*/.test(url)) {
      throw new Error(`Wrong url format: ${url}`);
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

        page.content('img').each((_ind, el) => {
          page.resourses.push({ tag: 'img', attr: 'src', link: page.content(el).attr('src') });
        });
        return createAssetsDirectory(dirpath, page.name);
      })
      .then((directory) => {
        page.resourcesDir = directory;
        const promises = page.resourses
          .map(({ link }) => (isAbsolutePath(link) ? `${address.origin}${link}` : link))
          .map((link) => getDataFromURL(link, 'arraybuffer'));
        return Promise.all(promises);
      })
      .then((results) => page.resourses.map(({ link }, index) => {
        const filepath = `${page.resourcesDir}/${strToFilename(link, address.host)}`;
        return save(filepath, results[index]);
      }))
      .then((resources) => Promise.all(resources))
      .then(() => page.resourses.forEach(({ tag, attr, link }) => {
        const filepath = `${page.resourcesDir}/${strToFilename(link, address.host)}`;
        page.content(`${tag}[${attr}=${link}]`).attr(attr, filepath);
      }))
      .then(() => save(page.dirpath, page.content.html()));
  } catch (err) {
    return Promise.reject(new Error(err.message || 'Wrong address'));
  }
};
