const fs = require('fs');
const path = require('path');
const { chunk, decodeBase64, naiveStringToBytes } = require('../../lib/stream');
const aes = require('../../lib/aes');
const xor = require('../../lib/xor');

const inputFile = fs.readFileSync(path.join(__dirname, '../../assets/2-10.txt'));

function challengeTen() {
  const IV = naiveStringToBytes(aes.pkcs7Pad('', 16, '\x00'));

  const ecbSettings = { key: 'YELLOW SUBMARINE' };

  const ciphertext = decodeBase64(inputFile);
  const chunkedCiphertext = chunk(ciphertext, 16);

  let previousBlock = IV;
  return chunkedCiphertext.reduce((acc, currentBlock) => {
    const temporaryCurrentPlaintext = aes.decrypt.ecb(ecbSettings, currentBlock);
    const nextCipherBlock = xor.bytes(previousBlock, temporaryCurrentPlaintext);

    previousBlock = currentBlock;
    return acc + nextCipherBlock;
  }, '');
}

module.exports = {
  run: challengeTen,
  describe: 'Implement CBC from ECB and XOR primitives.',
};
