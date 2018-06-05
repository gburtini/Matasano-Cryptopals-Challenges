const aes = require('../../lib/aes');
const xor = require('./../../lib/xor');

const { naiveBytesToString, naiveStringToBytes } = require('../../lib/stream');
const assert = require('assert');

function challenge() {
  const key = aes.randomKey();
  const ctrSettings = {
    key,
  };
  function ciphertextGenerator(inputString) {
    const prepend = 'comment1=cooking%20MCs;userdata='; // 32 bytes.
    const append = ';comment2=%20like%20a%20pound%20of%20bacon';

    const escapedString = inputString.replace(';', '";"').replace('=', '"="');
    const toBeEncrypted = `${prepend}${escapedString}${append}`;

    return naiveBytesToString(aes.encrypt.ctrNative(ctrSettings, toBeEncrypted));
  }
  function decrypt(ciphertext) {
    return naiveBytesToString(aes.decrypt.ctrNative(ctrSettings, ciphertext));
  }
  function validator(modifiedCiphertext) {
    const plaintext = decrypt(modifiedCiphertext);
    return plaintext.indexOf(';admin=true;') !== -1;
  }

  const targetPlaintext = '1234;admin=true;';
  const knownPlaintext = 'aaaaaaaaaaaaaaaa';
  const token = ciphertextGenerator(knownPlaintext);
  const prependPosition = 32;

  assert.ok(
    knownPlaintext.length === targetPlaintext.length,
    'Make sure the known and target text are identical length.'
  );

  const injectedKey = xor.bytes(
    naiveStringToBytes(knownPlaintext),
    naiveStringToBytes(token).slice(prependPosition, prependPosition + targetPlaintext.length)
  );

  const injectedCiphertext = naiveBytesToString(
    xor.bytes(naiveStringToBytes(targetPlaintext), injectedKey)
  );

  const modifiedCiphertext = `${token.slice(0, prependPosition)}${injectedCiphertext}${token.slice(
    prependPosition + injectedCiphertext.length
  )}`;

  // challenge requires that we have successfully added admin=true to our ciphertext.
  assert.ok(
    validator(modifiedCiphertext),
    'Modified ciphertext did not include ;admin=true; as desired.'
  );
  return decrypt(modifiedCiphertext);
}

module.exports = {
  run: challenge,
  describe: 'CTR bitflipping.',
};
