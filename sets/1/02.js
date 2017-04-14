const { decodeHex } = require('../../lib/stream');
const xor = require('../../lib/xor');
const assert = require('assert');

function challengeTwo() {
  return assert.equal(
    xor
      .byte(
        decodeHex('1c0111001f010100061a024b53535009181c'),
        decodeHex('686974207468652062756c6c277320657965')
      )
      .toString('hex'),
    '746865206b696420646f6e277420706c6179'
  );
}

module.exports = {
  run: challengeTwo,
  describe: 'XOR two equal length buffers.',
};
