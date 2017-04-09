const fs = require('fs');
const path = require('path');
const { chunk, decodeBase64, naiveStringToBytes } = require('../../lib/stream');
const aes = require('../../lib/aes');
const xor = require('../../lib/xor');
const aesjs = require('aes-js');

const inputFile = fs.readFileSync(path.join(__dirname, '../../assets/2-10.txt'));

function challengeTen() {
  const IV = aes.pkcs7Pad('', 16, '\x00');
  const key = naiveStringToBytes('YELLOW SUBMARINE');
  const aesEcb = new aesjs.ModeOfOperation.ecb(key);

  const ciphertext = decodeBase64(inputFile);
  const chunkedCiphertext = chunk(ciphertext, 16);

  let previousBlock = IV;
  return chunkedCiphertext.reduce((acc, currentBlock) => {
    const temporaryCurrentPlaintext = aesEcb.decrypt(currentBlock);
    const nextCipherBlock = xor.byte(previousBlock, temporaryCurrentPlaintext);

    previousBlock = currentBlock;
    return acc + nextCipherBlock;
  }, '');
}

module.exports = {
  run: challengeTen,
  describe: 'Implement CBC from ECB and XOR primitives.',
};