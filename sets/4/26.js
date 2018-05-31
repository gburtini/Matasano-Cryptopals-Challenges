const aes = require('../../lib/aes');
const xor = require('./../../lib/xor');

const { naiveBytesToString } = require('../../lib/stream');
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

    return naiveBytesToString(aes.encrypt.ctrNative(ctrSettings, aes.pkcs7Pad(toBeEncrypted)));
  }
  function decrypt(ciphertext) {
    return naiveBytesToString(aes.decrypt.ctrNative(ctrSettings, ciphertext));
  }
  function validator(modifiedCiphertext) {
    const plaintext = decrypt(modifiedCiphertext);
    console.log(plaintext);
    return plaintext.indexOf(';admin=true;') !== -1;
  }

  const originalCiphertext = ciphertextGenerator('bogus');
  const knownPlaintext = 'oking%20MCs;'; // we're going to inject in the middle of prepend.
  const targetPlaintext = ';admin=true;';
  const start = 11;

  assert.ok(
    knownPlaintext.length === targetPlaintext.length,
    'Make sure the known and target text are identical length.'
  );
  const injectedKey = xor.bytes(
    new Buffer(knownPlaintext, 'utf8'),
    new Buffer(originalCiphertext, 'utf8').slice(start, start + targetPlaintext.length)
  );

  console.log(
    new Buffer(knownPlaintext, 'utf8'),
    new Buffer(originalCiphertext, 'utf8').slice(start, start + targetPlaintext.length),
    injectedKey
  );
  const injectedCiphertext = naiveBytesToString(
    xor.bytes(new Buffer(targetPlaintext), injectedKey)
  );

  const modifiedCiphertext = `${originalCiphertext.slice(
    0,
    start
  )}${injectedCiphertext}${originalCiphertext.slice(start + injectedCiphertext.length)}`;

  // challenge requires that we have successfully added admin=true to our ciphertext. check that this is true.
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
