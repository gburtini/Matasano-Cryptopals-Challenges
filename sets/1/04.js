const fs = require('fs');
const path = require('path');

const { decodeHex } = require('../../lib/stream');
const { findMostLikelyPlaintext } = require('../../lib/attacks');
const { commonLetters } = require('../../lib/scores');

const inputFile = fs.readFileSync(
  path.join(__dirname, '../../assets/1-4.txt'),
  'ascii'
);

function challengeFour() {
  const records = inputFile.split('\n');

  let bestRecord = null;
  let bestValue = -Infinity;
  records.forEach((record) => {
    const bestGuess = findMostLikelyPlaintext(
      decodeHex(record)
    ).plainTextCandidate;

    if (commonLetters(bestGuess) > bestValue) {
      bestValue = commonLetters(bestGuess);
      bestRecord = bestGuess;
    }
  });

  return bestRecord;
}

module.exports = {
  run: challengeFour,
  describe: 'Identify which record is likely single-byte key XOR encrypted, decrypt it.',
};
