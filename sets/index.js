/* eslint-disable global-require, import/no-dynamic-require */
const path = require('path');
const fs = require('fs');

/*
 * Import all the challenges flat - so instead of 1.1 and 2.9, we just have
 * an array of challenges 1 through N.
 */
const dir = fs.readdirSync(__dirname);
dir.forEach((directoryName) => {
  const directoryPath = path.join(__dirname, directoryName);
  if (fs.lstatSync(directoryPath).isDirectory()) {
    // recurse one deep in to the set directories.
    const set = fs.readdirSync(directoryPath);
    set.forEach((challengeFile) => {
      if (path.extname(challengeFile) === '.js') {
        const basename = path.basename(challengeFile);
        const challengeNumber = basename.substr(0, basename.lastIndexOf('.'));
        const challengeFilePath = path.join(directoryPath, challengeFile);

        module.exports[challengeNumber] = require(challengeFilePath);
      }
    });
  }
});
