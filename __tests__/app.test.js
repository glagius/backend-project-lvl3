import {
  test, expect, describe,
} from '@jest/globals';
import path from 'path';
import app from '../index.js';

describe('Test how app works with commands', () => {
  const fakeUrl = 'https://ru.hexlet.io/courses';
  const pathFromUrl = 'ru-hexlet-io-courses';
  const currentDir = process.cwd();

  test('App return path when got only url', () => {
    const dirPath = path.resolve(currentDir, pathFromUrl);
    expect(app(fakeUrl)).toBe(dirPath);
  });
  test('App return path when got path and url arguments', () => {
    const dirPath = '/var/tmp';
    expect(app(fakeUrl, dirPath)).toBe(path.resolve(dirPath, pathFromUrl));
  });
});
describe('Test how app works with http requests', () => {

});
describe('Test how app works with disk storage', () => {

});
describe('Test how app handles errors', () => {

});
