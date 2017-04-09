const xor = require('../../lib/xor');

function challengeFive() {
  const plaintext = `Burning 'em, if you ain't quick and nimble
I go crazy when I hear a cymbal`;
  const key = 'ICE';

  return xor.key(plaintext, key).toString('hex');
}

module.exports = {
  run: challengeFive,
  describe: 'Implement repeating key XOR',
};
