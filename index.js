import Debug from 'debug';
import AxiosLogger from 'axios-debug-log';
import pageLoader from './src/index.js';

const appLogger = Debug('page-loader:app');
const httpLogger = Debug('page-loader:http');
const httpErrorLogger = Debug('page-loader:http-error');

AxiosLogger({
  request: (_deb, config) => {
    const { url, method, headers } = config;
    httpLogger('Request to: %o, \nMethod: %o, \nHeaders: %o', url, method, headers);
  },
  response: (_deb, response) => {
    const {
      status, statusText, headers, config: { url, method },
    } = response;
    httpLogger('Response from: %o \nMethod: %o \nStatus: %o \nStatusText: %o \nHeaders: %o', url, method, status, statusText, headers);
  },
  error: (_deb, error) => {
    const { response: { status, data }, message } = error;
    httpErrorLogger('Error: %o, Status: %o, ErrorData: %o', message, status, data);
  },
});

export default (url, outputDirPath = process.cwd()) => pageLoader(url, outputDirPath, appLogger)
  .catch((error) => {
    appLogger(error.message);
    throw error;
  });
