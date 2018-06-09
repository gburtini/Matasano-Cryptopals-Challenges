const aes = require('../../lib/aes');
const xor = require('./../../lib/xor');

const { naiveBytesToString, naiveStringToBytes, chunk } = require('../../lib/stream');
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

    return aes.encrypt.cbc(cbcSettings, `${b1}${b2}${b3}`);
  }

  function decryptAndError(message) {
    const plaintext = aes.decrypt.cbc(cbcSettings, message);
    const highAscii = !isAscii(plaintext); // if high ASCII, throw an error.
    if (highAscii) {
      const error = new Error('High ASCII found.');
      error.plaintext = plaintext;
      throw error;
    }
    return plaintext;
  }

  function bruteforceByteExchange(from, to) {
    for (let i = 1; i < 256; i++) {
      if ((from.charCodeAt(0) ^ i) === to.charCodeAt(0)) {
        return i;
      }
    }
    throw new Error(`Unable to find byte exchange for ${from} to ${to}.`);
  }
  function swapCharacterInNextBlock(block, location, from, to) {
    const clonedArray = block.slice(0);
    clonedArray[location] = String.fromCharCode(
      clonedArray[location].charCodeAt(0) ^ bruteforceByteExchange(from, to)
    );
    return clonedArray;
  }

  const ciphertext = chunk(
    naiveBytesToString(encrypt('1234567812345678', 'abcdefghabcdefgh', '!@#$%^&*!@#$%^&*')),
    16
  );
  // TODO: attack with bitflipping to substitute block 2 with the 0 block.
  // using the zero block works because it assures that the first ciphertext block and the one after the
  // zero block are both encrypted (XOR'd) with just the key... same key means b1 XOR b3 == key.
  ciphertext[0] = swapCharacterInNextBlock(ciphertext[0], 0, 'a', String.fromCharCode(0));
  ciphertext[0] = swapCharacterInNextBlock(ciphertext[0], 1, 'b', String.fromCharCode(0));
  ciphertext[0] = swapCharacterInNextBlock(ciphertext[0], 2, 'c', String.fromCharCode(0));
  ciphertext[0] = swapCharacterInNextBlock(ciphertext[0], 3, 'd', String.fromCharCode(0));

  console.log(decryptAndError(ciphertext));
  const attackedText = 'bogon';
  try {
    return decryptAndError(attackedText);
  } catch (e) {
    // we have high ascii.
    const invalidPlaintext = e.plaintext;
    const chunks = chunk(invalidPlaintext, 16);
    const recoveredKey = xor.byte(chunks[0], chunks[2]);
    // TODO: validate that the key is right.
    return recoveredKey;
  }
}

module.exports = {
  run: challenge,
  describe: 'Recover the key from CBC with IV=Key.',
};
