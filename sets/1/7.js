const fs = require('fs');
const path = require('path');
const { decodeBase64, naiveStringToBytes } = require('../../lib/stream');
const aesjs = require('aes-js');

const inputFile = fs.readFileSync(path.join(__dirname, '../../assets/1-7.txt'));

function challengeSeven() {
  const key = naiveStringToBytes('YELLOW SUBMARINE');
  const ciphertext = decodeBase64(inputFile);
  const aesEcb = new aesjs.ModeOfOperation.ecb(key);

  return aesjs.utils.utf8.fromBytes(aesEcb.decrypt(ciphertext));
}

module.exports = {
  run: challengeSeven,
  describe: 'Decrypt AES in ECB mode with known key',
};
