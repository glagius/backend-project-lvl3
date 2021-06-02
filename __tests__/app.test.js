import {
  test, expect, describe, afterEach,
} from '@jest/globals';
import path from 'path';
import nock from 'nock';
import * as fsPromises from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';
import app from '../index.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const fakeUrl = new URL('http://ru.hexlet.io/courses');
const pathFromUrl = 'ru-hexlet-io-courses';
const fakeheaders = {
  'Content-type': 'text/html',
};

describe('Test how app works with http requests', () => {
  let tmpdir;

  beforeEach(async () => {
    tmpdir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });
  afterEach(async () => {
    await fsPromises.rm(tmpdir, { recursive: true });
  });

  test('App return path to directory when page loaded', async () => {
    nock(fakeUrl.origin).get(fakeUrl.pathname).replyWithFile(200, `${dirname}/fixtures/index.html`, fakeheaders);
    const output = `${path.resolve(tmpdir, pathFromUrl)}.html`;
    const result = await app(fakeUrl.href, tmpdir);
    expect(result).toEqual(expect.arrayContaining(['success', output]));
  });
  test('App shows error message when request fails', async () => {
    nock(fakeUrl.origin).get(fakeUrl.pathname).reply(404);
    await expect(app(fakeUrl.href, tmpdir)).resolves.toEqual(expect.arrayContaining(['error']));
  });
});

describe('Test how app works with disk storage', () => {

});
describe('Test how app handles errors', () => {

});
