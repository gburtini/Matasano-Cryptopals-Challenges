const { decodeHex } = require('../../lib/stream');
const { findMostLikelyPlaintext } = require('../../lib/attacks');

function challengeThree() {
  const ciphertext = decodeHex(
    '1b37373331363f78151b7f2b783431333d78397828372d363c78373e783a393b3736'
  );

  return findMostLikelyPlaintext(ciphertext);
}

module.exports = {
  run: challengeThree,
  describe: 'Single-byte key XOR cipher. Bruteforce the 1-byte key and identify likely plaintexts.',
};
