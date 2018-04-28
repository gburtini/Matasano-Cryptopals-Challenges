const mt19937 = require('./../../lib/mt19937');
const assert = require('assert');
const xor = require('./../../lib/xor');
const { naiveStringToBytes, naiveBytesToString } = require('./../../lib/stream');
const { randomBytes } = require('./../../lib/aes');

function challenge() {
  function encrypt(keystream, plaintext) {
    return naiveBytesToString(
      naiveStringToBytes(plaintext).map((i) => {
        const keyIndex = keystream() & 0xff;
        return xor.byte(keyIndex, i);
      })
    );
  }

  const plainInput = 'A'.repeat(14) + randomBytes(100);
  const rng = mt19937.create(108123);
  const ciphertext = encrypt(rng, plainInput);

  const known = ciphertext.slice(0, 14);
  let key;
  // Can we do better than bruteforce? Can we clone from a partial sequence?
  for (let i = 0; i < 2 ** 32; i++) {
    if (encrypt(mt19937.create(i), known) === 'A'.repeat(14)) {
      console.log('Key found', i);
      key = i;
      break;
    }
  }

  const recoveredInput = encrypt(mt19937.create(key), ciphertext);
  assert(recoveredInput === plainInput);
}

module.exports = {
  run: challenge,
  describe: 'Create the MT19937 stream cipher and break it.',
};
