const aes = require('../../lib/aes');
const xor = require('./../../lib/xor');

const { naiveBytesToString, naiveStringToBytes } = require('../../lib/stream');
const assert = require('assert');

function isAscii(str) {
  // eslint-disable-next-line no-control-regex
  return /^[\x00-\x7F]*$/.test(str);
}

function challenge() {
  const key = aes.randomKey();
  const cbcSettings = {
    key,
    iv: key,
  };

  function encrypt(b1, b2, b3) {
    // encrypts a 3 block message.
    if (b1.length !== 16 || b2.length !== 16 || b3.length !== 16) {
      throw new Error('All blocks should be exactly 16 bytes long.');
    }

    return aes.encrypt.cbc(`${b1}${b2}${b3}`, cbcSettings);
  }

  function decryptAndError(message) {
    const plaintext = aes.decrypt.cbc(message, cbcSettings);
    const highAscii = !isAscii(plaintext); // if high ASCII, throw an error.
    if (highAscii) {
      const error = new Error('High ASCII found.');
      error.plaintext = plaintext;
      throw error;
    }
    return plaintext;
  }

  const ciphertext = encrypt('1234567812345678', 'abcdefghabcdefgh', '!@#$%^&*!@#$%^&*');
  // TODO: attack with bitflipping to substitute block 2 with the 0 block... make sure we cause high ascii.
  // using the zero block works because it assures that the first ciphertext block and the one after the
  // zero block are both encrypted (XOR'd) with just the key... same key means b1 XOR b3 == key.
  try {
    decryptAndError(attackedText);
  } catch (e) {
    // we have high ascii.
    const invalidPlaintext = e.plaintext;
    const chunks = chunk(invalidPlaintext);
    const recoveredKey = xor.byte(chunks[0], chunks[2]);
    // TODO: validate that the key is right.
    return recoveredKey;
  }
}

module.exports = {
  run: challenge,
  describe: 'Recover the key from CBC with IV=Key.',
};
