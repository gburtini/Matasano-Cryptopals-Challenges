const aes = require('../../lib/aes');
const attacks = require('../../lib/attacks');
const { decodeBase64, naiveStringToBytes, naiveBytesToString, chunk } = require('../../lib/stream');

const fs = require('fs');
const path = require('path');

const inputFile = fs.readFileSync(path.join(__dirname, '../../assets/3-20.txt'), 'ascii');

function challengeTwenty() {
  const INPUTS = inputFile
    .split('\n')
    .map(decodeBase64)
    .map((i) => {
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
  const input = INPUTS.map(i => i.substring(0, minLength));

  return chunk(attacks.breakRepeatingKeyXor(input.join(''), minLength, minLength + 1), minLength)
    .map(i => i.join(''))
    .join('\n');
}

module.exports = {
  run: challengeTwenty,
  describe: 'Break fixed-nonce CTR statistically.',
};
