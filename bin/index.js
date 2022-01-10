#!/usr/bin/env node
/*
  Download and save all page files given from cmd.
*/

import { Command } from 'commander/esm.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import pageLoader from '../src/index.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const program = new Command();

readFile(new URL('../package.json', import.meta.url))
  .then((json) => JSON.parse(json))
  .then((info) => {
    program
      .version(info.version, '-V, --version', 'output version number')
      .description('Page-loader utility.')
      .arguments('<url>')
      .option('-o, --output <dir>', 'output directory (default: "/home/user/<current-directory>")')
      .action((url, { output }) => {
        const directory = output ?? dirname;
        return pageLoader(url, directory)
          .then((filepath) => {
            console.log(`Page was successfully downloaded into ${filepath}`);
          })
          .catch((err) => {
            console.error(err);
            process.exit(1);
          });
      })
      .parse(process.argv);
  });
