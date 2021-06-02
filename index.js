// @ts-check
import axios from 'axios';
import { appendFile } from 'fs/promises';

const urlToPath = (address) => {
  const { host, pathname, hash } = new URL(address);
  return [host, pathname, hash].map((str) => str.replace(/\W/g, '-'))
    .join('');
};

export default (url, output) => axios.get(url)
  .then((res) => res.data)
  .then((data) => {
    const filename = urlToPath(url);
    const filepath = `${output}/${filename}.html`;
    return appendFile(filepath, data).then(() => ['success', filepath]);
  })
  .catch((error) => {
    const info = error.toJSON();
    return ['error', info.message];
  });
// .catch((err) => console.error('Network error:', err.response.status));
/*
do some magic.
    1. Validate path. Throw error if incorrect.
    2. Make request to url. If url is incorrect - throw Error.
    3. Set delay for request. If > 4000 - reject request.
    3. Parse response. If isn't 200, return.
    4. Create dir for response files.
    5. Save response in new dir.
    6. Return dir path.
  */
