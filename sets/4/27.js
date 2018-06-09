const aes = require('../../lib/aes');
const xor = require('./../../lib/xor');

const { naiveBytesToString, chunk, unchunk } = require('../../lib/stream');

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
    const plaintext = naiveBytesToString(aes.decrypt.cbc(cbcSettings, message));

    const highAscii = !isAscii(plaintext); // if high ASCII, throw an error.
    if (highAscii) {
      const error = new Error('High ASCII found.');
      error.plaintext = plaintext;
      throw error;
    }
    return plaintext;
  }

  const originalCiphertext = naiveBytesToString(
    encrypt('1234567812345678', 'abcdefghabcdefgh', '!@#$%^&*!@#$%^&*')
  );

  const ciphertext = chunk(originalCiphertext, 16);
  ciphertext[1] = Array(16).fill(String.fromCharCode(0));
  ciphertext[2] = ciphertext[0];
  const attackedText = unchunk(ciphertext);

  try {
    decryptAndError(attackedText);
  } catch (e) {
    // we have high ascii.
    const invalidPlaintext = e.plaintext;

    const chunks = chunk(invalidPlaintext, 16).map((c) => {
      return Buffer.from(c.map(i => i.charCodeAt(0)));
    });

    // this recovers the IV (because the first block is IV xor C1 and the last block is 0 xor C1)
    // which we know is also the key because it was reused.
    const recoveredKey = xor.bytes(chunks[0], chunks[2]).toString();

    return naiveBytesToString(
      aes.decrypt.cbc({ key: recoveredKey, iv: recoveredKey }, originalCiphertext)
    );
  }

  return false;
}

module.exports = {
  run: challenge,
  describe: 'Recover the key from CBC with IV=Key.',
};
