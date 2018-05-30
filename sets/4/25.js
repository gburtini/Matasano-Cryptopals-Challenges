const aes = require('./../../lib/aes');
const xor = require('./../../lib/xor');
const { naiveBytesToString, decodeBase64 } = require('./../../lib/stream');

const fs = require('fs');
const path = require('path');

const inputFile = naiveBytesToString(
  decodeBase64(fs.readFileSync(path.join(__dirname, '../../assets/4-25.txt'), 'base64'))
);
const IV = aes.pkcs7Pad('', 16, '\x00');
const originalText = naiveBytesToString(
  aes.decrypt.ecb({ key: 'YELLOW SUBMARINE', iv: IV }, inputFile)
);

function challenge() {
  // The theory here should be pretty simple. AES CTR is basically XOR with an
  // incrementing int. If you can see the same int twice (aka, random rewrite)
  // you can recover plaintext.

  const key = '0000000000000000';
  const nonce = aes.arbitraryPad('', 8, String.fromCharCode(0));

  function edit(cipherText, offset, newText) {
    const plainText = naiveBytesToString(
      aes.decrypt.ctrNative(
        {
          key,
          nonce,
        },
        cipherText
      )
    );

    const newPlainText = `${plainText.slice(0, offset)}${newText}${plainText.slice(
      offset + newText.length
    )}`;

    const newCipherText = aes.encrypt.ctrNative(
      {
        key,
        nonce,
      },
      newPlainText
    );

    return naiveBytesToString(newCipherText);
  }

  function recover(cipherText) {
    let text = '';
    for (let i = 0; i < cipherText.length; i += 16) {
      const forcedBlock = 'A'.repeat(16);
      const forcedText = edit(cipherText, i, forcedBlock);

      // the first block of forcedText will be AAA XOR cipheredCounter.
      // so we can recover cipheredCounter in full, which can then be used to XOR and
      // recover the original cipherText; repeat for each block.

      const ftSubstr = forcedText.substr(i, 16);
      const ctSubstr = cipherText.substr(i, 16);

      const blockKey = xor.bytes(
        new Buffer(ftSubstr, 'ascii'),
        new Buffer(forcedBlock.substr(0, ftSubstr.length), 'ascii')
      );
      // console.log('key', forcedBlock, naiveBytesToString(blockKey));
      const plainText = xor.bytes(new Buffer(ctSubstr, 'ascii'), new Buffer(blockKey, 'ascii'));

      text += naiveBytesToString(plainText);
    }
    return text;
  }

  const cipherText = naiveBytesToString(aes.encrypt.ctrNative({ key, nonce }, originalText));

  return recover(cipherText);
}

module.exports = {
  run: challenge,
  describe: 'Break "random access read/write" AES CTR.',
};
