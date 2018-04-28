const aes = require('./../../lib/aes');

function challenge() {
  // The theory here should be pretty simple. AES CTR is basically XOR with an
  // incrementing int. If you can see the same int twice (aka, random rewrite)
  // you can recover plaintext.

  const key = '';
  const nonce = '';

  function edit(cipherText, offset, newText) {
    const plainText = aes.decrypt.ctr(
      {
        key,
        nonce,
      },
      cipherText
    );

    const newPlainText = `${plainText.slice(0, offset)}${newText}${plainText.slice(
      offset + newText.length
    )}`;
    const newCipherText = aes.encrypt.ctr(
      {
        key,
        nonce,
      },
      newPlainText
    );

    return newCipherText;
  }

  function recover(cipherText) {
    const forcedText = edit(cipherText, 0, 'A'.repeat(16));
    // the first block of forcedText will be AAA XOR cipheredCounter.
    // so we can recover cipheredCounter in full, which can then be used to XOR and recover the original cipherText.
    // repeat for each block.
  }
}

module.exports = {
  run: challenge,
  describe: 'Break "random access read/write" AES CTR.',
};
