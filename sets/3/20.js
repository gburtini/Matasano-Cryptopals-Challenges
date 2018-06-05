const aes = require('../../lib/aes');
const attacks = require('../../lib/attacks');
const { decodeBase64, chunk } = require('../../lib/stream');

const fs = require('fs');
const path = require('path');

const inputFile = fs.readFileSync(path.join(__dirname, '../../assets/3-20.txt'), 'ascii');

function challengeTwenty() {
  const INPUTS = inputFile
    .split('\n')
    .map(decodeBase64)
    .map((i) => {
      if (!i.length) return false; // the last line is empty.
      return aes.encrypt.ctr(
        {
          key: 'YELLOW SUBMARINE',
          nonce: '00000000',
        },
        i
      );
    })
    .filter(i => i);

  const minLength = Math.min(...INPUTS.map(i => i.length));

  // NOTE: we're forced to truncate the inputs here to the minimum length because of how `attacks.breakRepeatingKey` works
  // but I wonder if there isn't an obvious way to solve the rest of it once we've solved some. In any case, there's no reason
  // we need to do the minimum length; some longer length could definitely be done (so long as there's numerous samples).
  const input = INPUTS.map(i => i.substring(0, minLength));

  return chunk(attacks.breakRepeatingKeyXor(input.join(''), minLength, minLength + 1), minLength)
    .map(i => i.join(''))
    .join('\n');
}

module.exports = {
  run: challengeTwenty,
  describe: 'Break fixed-nonce CTR statistically.',
};
