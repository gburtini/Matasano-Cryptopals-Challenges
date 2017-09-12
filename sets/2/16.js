/* eslint-disable no-bitwise */
const aes = require('../../lib/aes');
const { unchunk, chunk, naiveBytesToString } = require('../../lib/stream');
const assert = require('assert');

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

function challengeSixteen() {
  const key = aes.randomKey();
  const cbcSettings = {
    key,
    iv: aes.pkcs7Pad('', 16, '\x00'),
  };
  function ciphertextGenerator(inputString) {
    const prepend = 'comment1=cooking%20MCs;userdata='; // 32 bytes.
    const append = ';comment2=%20like%20a%20pound%20of%20bacon';

    const escapedString = inputString.replace(';', '";"').replace('=', '"="');
    const toBeEncrypted = `${prepend}${escapedString}${append}`;

    return naiveBytesToString(aes.encrypt.cbc(cbcSettings, aes.pkcs7Pad(toBeEncrypted)));
  }
  function decrypt(ciphertext) {
    return naiveBytesToString(aes.decrypt.cbc(cbcSettings, ciphertext));
  }
  function validator(modifiedCiphertext) {
    const plaintext = decrypt(modifiedCiphertext);
    return plaintext.indexOf(';admin=true;') !== -1;
  }

  // per the challenge, it should not be possible to directly provide admin=true to the ciphertext generator.
  assert.equal(
    validator(ciphertextGenerator(';admin=true;')),
    false,
    'Ciphertext generator allowed ;admin=true; without bitflipping.'
  );

  // = is 61 in ascii or 00111101 in binary.
  const preflipped = ciphertextGenerator('-admin2true');
  const chunks = chunk(preflipped, 16);
  chunks[1] = swapCharacterInNextBlock(chunks[1], 6, '2', '=');
  chunks[1] = swapCharacterInNextBlock(chunks[1], 0, '-', ';');
  const modifiedCiphertext = unchunk(chunks);

  // challenge requires that we have successfully added admin=true to our ciphertext. check that this is true.
  assert.ok(
    validator(modifiedCiphertext),
    'Modified ciphertext did not include ;admin=true; as desired.'
  );
  return decrypt(modifiedCiphertext);
}

module.exports = {
  run: challengeSixteen,
  describe: 'Flipping a bit in a block flips the identical bit in the next block.',
};
