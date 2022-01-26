#!/usr/bin/env node
import { Command } from 'commander/esm.mjs';
import { readFile } from 'fs/promises';
import pageLoader from '../index.js';

const program = new Command();

readFile(new URL('../package.json', import.meta.url))
  .then((json) => JSON.parse(json))
  .then((info) => program
    .version(info.version, '-V, --version', 'output version number')
    .description('Page-loader utility.')
    .arguments('<url>')
    .option('-o, --output <dir>', 'output directory (default: "/home/user/<current-directory>")')
    .action((url, { output }) => pageLoader(url, output)
      .then((filepath) => {
        console.log(`Page was successfully downloaded into ${filepath}`);
      })
      .catch((err) => {
        console.error(err);
        process.exit(1);
      }))
    .parse(process.argv));
