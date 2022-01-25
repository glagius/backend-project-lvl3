import pageLoader from './src';
import { appLogger } from './src/utils';

export default (url, outputDirPath = process.cwd()) => pageLoader(url, outputDirPath, appLogger);
