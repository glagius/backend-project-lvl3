// @ts-check
import path from 'path';

const urlToHost = (url) => {
  const { host, pathname, hash } = new URL(url);
  return [host, pathname, hash].map((str) => str.replace(/\W/g, '-'))
    .join('');
};

export default (url, output = process.cwd()) => {
  // do some magic
  // return path for saved directory
  /*
    1. Validate path. Throw error if incorrect.
    2. Make request to url. If url is incorrect - throw Error.
    3. Set delay for request. If > 4000 - reject request.
    3. Parse response. If isn't 200, return.
    4. Create dir for response files.
    5. Save response in new dir.
    6. Return dir path.
  */
  const newDir = urlToHost(url);
  return path.resolve(output, newDir);
};
