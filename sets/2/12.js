const fs = require('fs');
const path = require('path');
const { chunk, decodeBase64, naiveBytesToString } = require('../../lib/stream');
const aes = require('../../lib/aes');
const attacks = require('../../lib/attacks');

const inputFile = fs.readFileSync(path.join(__dirname, '../../assets/2-12.txt'), 'base64');

function challengeTwelve() {
  const unknownString = naiveBytesToString(
    decodeBase64(inputFile)
  );

  function cipher(known, unknown = '', key = 'YELLOW SUBMARINE') {
    // NOTE: Cipher should be interpreted as being a blackbox we don't control.
    // i.e., imagine it as a server that you can ask to encrypt some known text
    // and it will add the unknown text to it.
    const ecbSettings = {
      key,
    };
    return aes.encrypt.ecb(ecbSettings, aes.pkcs7Pad(known + unknown));
  }

  const blockSize = aes.detectBlockSize(cipher);
  const mode = aes.modeOracle(cipher);
  if (mode !== 'ecb') throw new Error('Byte-at-a-time decryption only supports ECB.');

  const chunks = chunk(unknownString, blockSize);
  return chunks.reduce((acc, thisBlock) => {
    return acc + attacks.breakKnownPrefixEcb(
      thisBlock.join(''),
      cipher,
      blockSize
    );
  }, '');
}

module.exports = {
  run: challengeTwelve,
  describe: 'Byte-at-a-time AES ECB decryption from partially (prefix) chosen plaintext.',
};
