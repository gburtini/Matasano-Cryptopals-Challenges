const fs = require('fs');
const path = require('path');

const { decodeBase64 } = require('../../lib/stream');
const { breakRepeatingKeyXor } = require('../../lib/attacks');
const scores = require('../../lib/scores');
const assert = require('assert');

const inputFile = fs.readFileSync(
  path.join(__dirname, '../../assets/1-6.txt'),
  'base64'
);

function challengeSix() {
  // for diagnostics... breakRepeatingKeyXor is dependent on Hamming score.
  assert.equal(
    scores.hamming(
      new Buffer('this is a test', 'ascii'),
      new Buffer('wokka wokka!!!', 'ascii')
    ),
    37
  );

  const ciphertext = decodeBase64(inputFile);

  return breakRepeatingKeyXor(ciphertext);
}

module.exports = {
  run: challengeSix,
  describe: 'Break repeating key XOR w/ Hamming score key identification.',
};
