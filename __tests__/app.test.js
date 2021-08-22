import {
  test, expect, describe, afterEach,
} from '@jest/globals';
import path from 'path';
import nock from 'nock';
import * as fsPromises from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';
import app from '../index.js';
import { strToFilename } from '../src/utils.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const assetsDir = 'ru-hexlet-io-courses_files';
const fakeUrl = new URL('http://ru.hexlet.io/courses');
const pathFromUrl = 'ru-hexlet-io-courses';
const fakeheaders = {
  'Content-type': 'text/html',
};

describe('Test how app works with success http requests', () => {
  let tmpdir;
  const assets = [
    '/assets/professions/nodejs.png',
    // '/assets/professions/script.js',
    // '/assets/application.css',
  ];
  const assetsFolder = 'ru-hexlet-io-courses_files';

  beforeEach(async () => {
    tmpdir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    nock(fakeUrl.origin)
      .get(fakeUrl.pathname)
      .replyWithFile(200, `${dirname}/fixtures/courses.html`, fakeheaders);

    nock(fakeUrl.origin)
      .get((url) => assets.includes(url))
      .reply((url) => [
        200,
        fsPromises.readFile(`${dirname}/fixtures${url}`),
      ]);
  });
  afterEach(async () => {
    await fsPromises.rm(tmpdir, { recursive: true });
    nock.cleanAll();
  });

  test('App return path to directory when page loaded', async () => {
    nock(fakeUrl.origin).get(fakeUrl.pathname).replyWithFile(200, `${dirname}/fixtures/courses.html`, fakeheaders);
    const output = `${path.resolve(tmpdir, pathFromUrl)}.html`;
    const result = await app(fakeUrl.href, tmpdir);
    expect(result).toEqual(output);
  });

  test('App modifies assets path', () => {
    const expectedAddresses = [
      'ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png',
      // 'ru-hexlet-io-courses_files/ru-hexlet-io-assets-application.css',
      // 'ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-script.js',
    ];

    assets.forEach((asset, ind) => expect(`${assetsFolder}/${strToFilename(asset, fakeUrl.host)}`)
      .toEqual(expectedAddresses[ind]));
  });
  test('App creates directory for included files', async () => {
    await app(fakeUrl.href, tmpdir);
    const directory = await fsPromises.readdir(tmpdir);
    expect(directory).toContain(assetsDir);
  });
  test('App saves images into created directory', async () => {
    await app(fakeUrl.href, tmpdir);
    const page = await fsPromises.readFile(`${tmpdir}/${pathFromUrl}.html`, 'utf8');
    const directory = await fsPromises.readdir(`${tmpdir}/${assetsFolder}`);
    const promises = assets.map((asset) => {
      const assetname = strToFilename(asset, fakeUrl.host);
      expect(directory).toContain(assetname);
      expect(page.includes(`${tmpdir}/${assetsFolder}/${assetname}`)).toBe(true);
      return fsPromises.readFile(path.resolve(`${dirname}/fixtures/${asset}`));
    });
    const contents = await Promise.all(promises);
    const image = await fsPromises.readFile(path.resolve(`${dirname}/fixtures/${assets[0]}`));
    expect(contents.filter((el) => image.equals(el))).toHaveLength(1);
  });
});

describe('Negative test cases', () => {
  let tmpdir;

  test('App shows error message when request fails', async () => {
    nock(fakeUrl.origin).get(fakeUrl.pathname).reply(404);
    await expect(app(fakeUrl.href, tmpdir)).rejects.toThrow('Request failed with status code 404');
  });
  test('App shows error on wrong url address', async () => {
    await expect(app('some-stupid-address/', tmpdir)).rejects.toThrow();
  });
});
