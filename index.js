import pageLoader from './src/index.js';

export default (url, outputDirPath = process.cwd()) => pageLoader(url, outputDirPath);
