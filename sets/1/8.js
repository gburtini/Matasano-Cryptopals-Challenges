const fs = require('fs');
const path = require('path');
const { decodeHex } = require('../../lib/stream');
const { isEcb } = require('../../lib/aes');

const inputFile = fs.readFileSync(
  path.join(__dirname, '../../assets/1-8.txt')
);

function challengeEight() {
  const records = inputFile.toString().split('\n');

  for (let line = 0; line < records.length; line++) {
    const record = decodeHex(records[line]).toString('ascii');

    if (isEcb(record)) {
      return `Line ${line} likely is AES-ECB encrypted.`;
    }
  }

  throw new Error('No AES-ECB encrypted lines found.');
}

module.exports = {
  run: challengeEight,
};
