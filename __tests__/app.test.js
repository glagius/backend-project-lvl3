import {
  test, expect, describe, afterEach, beforeEach,
} from '@jest/globals';
import path from 'path';
import nock from 'nock';
import * as fsPromises from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';
import app from '../src/index.js';
import { createPageFilename, strToFilename } from '../src/utils.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const assetsDir = 'ru-hexlet-io-courses_files';
const fakeHexlet = new URL('https://ru.hexlet.io');
const fakeCourses = new URL(`${fakeHexlet.origin}/courses`);
const pathFromUrl = 'ru-hexlet-io-courses';
const fakeheaders = {
  'Content-type': 'text/html',
};

const assetsPaths = [
  '/assets/professions/nodejs.png',
  '/assets/application.css',
  'https://ru.hexlet.io/packs/js/runtime.js',
];
const assets = [
  'nodejs.png',
  'application.css',
  'runtime.js',
];

process.env.DEBUG = `nock.scope:${fakeHexlet.origin}`;

describe('Test utils functions', () => {
  test('App modifies assets path', async () => {
    const relativePaths = ['./assets/professions/nodejs.png', './assets/application.css'];
    const expectedAddresses = [
      'ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png',
      'ru-hexlet-io-courses_files/ru-hexlet-io-assets-application.css',
      'ru-hexlet-io-courses_files/ru-hexlet-io-packs-js-runtime.js',
      'ru-hexlet-io-courses_files/ru-hexlet-io-courses.html',
    ];
    assetsPaths.forEach((asset, ind) => expect(`${assetsDir}/${strToFilename(asset, fakeCourses.host)}`)
      .toEqual(expectedAddresses[ind]));
    relativePaths.forEach((asset, ind) => expect(`${assetsDir}/${strToFilename(asset, fakeCourses.host)}`)
      .toEqual(expectedAddresses[ind]));
  });
  test('App creates page filename from address', async () => {
    const url = new URL('https://github.com');
    const pageName = 'github-com';
    expect(createPageFilename(url)).toBe(pageName);
  });
});

describe('Test how app works with success http requests', () => {
  let tmpdir;
  const assetsRx = /(png|css|js)$/;

  beforeEach(async () => {
    tmpdir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    nock(fakeHexlet.origin)
      .get(fakeCourses.pathname)
      .replyWithFile(200, `${dirname}/fixtures/courses.html`, fakeheaders);

    nock(fakeHexlet.origin)
      .persist()
      .get((url) => assetsRx.test(url))
      .reply(async (url) => {
        const file = url.split('/').reverse()[0];
        return [
          200,
          await fsPromises.readFile(`${dirname}/fixtures/assets/${file}`),
        ];
      });
  });
  afterEach(async () => {
    await fsPromises.rm(tmpdir, { recursive: true });
    nock.cleanAll();
  });

  test('App return path to directory when page loaded', async () => {
    nock(fakeCourses.origin).get(fakeCourses.pathname).replyWithFile(200, `${dirname}/fixtures/courses.html`, fakeheaders);
    const result = await app(fakeCourses.href, tmpdir);
    const output = `${path.resolve(tmpdir, pathFromUrl)}.html`;
    expect(result).toEqual(output);
  });

  test('App creates directory for included files', async () => {
    await app(fakeCourses.href, tmpdir);
    const directory = await fsPromises.readdir(tmpdir);

    expect(directory).toContain(assetsDir);
  });

  test('App saves files into created directory', async () => {
    await app(fakeCourses.href, tmpdir);
    const page = await fsPromises.readFile(`${tmpdir}/${pathFromUrl}.html`, 'utf8');
    const directory = await fsPromises.readdir(`${tmpdir}/${assetsDir}`);
    const promises = assetsPaths.map((asset) => {
      const assetname = strToFilename(asset, fakeHexlet.host);
      expect(directory).toContain(assetname);
      expect(page.includes(`${assetsDir}/${assetname}`)).toBe(true);

      const fixture = assets.find((el) => asset.includes(el));
      return fsPromises.readFile(path.resolve(`${dirname}/fixtures/assets/${fixture}`));
    });

    const contents = await Promise.all(promises);
    const fixtures = assets.map((asset) => fsPromises.readFile(path.resolve(`${dirname}/fixtures/assets/${asset}`)));
    const fixturesContent = await Promise.all(fixtures);

    contents.forEach((el, index) => expect(fixturesContent[index].equals(el)).toBe(true));
  });
});

describe('Negative test cases', () => {
  let tmpdir;

  beforeEach(async () => {
    tmpdir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });

  afterEach(async () => {
    await fsPromises.rm(tmpdir, { recursive: true });
    nock.cleanAll();
  });
  test('App shows error message when got 404 statusCode', async () => {
    nock(fakeCourses.origin).get(fakeCourses.pathname).reply(404);
    await expect(app(fakeCourses.href, tmpdir)).rejects.toThrow('Request failed with status code 404');
  });
  test('App shows error message when got 302 statusCode', async () => {
    nock(fakeCourses.origin).get(fakeCourses.pathname).reply(302);
    await expect(app(fakeCourses.href, tmpdir)).rejects.toThrow('Request failed with status code 302');
  });
  test('App shows error message when got 500 statusCode', async () => {
    nock(fakeCourses.origin).get(fakeCourses.pathname).reply(500);
    await expect(app(fakeCourses.href, tmpdir)).rejects.toThrow('Request failed with status code 500');
  });
  test('App shows error message when got wrong directory for page', async () => {
    await expect(app(fakeCourses.href)).rejects.toThrow('Wrong path for directory: undefined');
    await expect(app(fakeCourses.href, '/sys')).rejects.toThrow('Failed to create assets directory in: /sys');
  });
  test('App shows error on wrong url address', async () => {
    await expect(app('some-stupid-address/', tmpdir)).rejects.toThrow();
  });
});
