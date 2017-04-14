const fs = require('fs');
const path = require('path');
const { chunk, decodeBase64, naiveStringToBytes, naiveBytesToString } = require('../../lib/stream');
const aes = require('../../lib/aes');
const aesjs = require('aes-js');
const attacks = require('../../lib/attacks');
const scores = require('../../lib/scores');

const inputFile = fs.readFileSync(path.join(__dirname, '../../assets/2-12.txt'), 'base64');
const prefixBytes = naiveBytesToString(aes.randomBytes(Math.floor(Math.random() * 15) + 1));

function challengeFourteen() {
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
    return aes.encrypt.ecb(ecbSettings, aes.pkcs7Pad(prefixBytes + known + unknown));
  }


  const blockSize = aes.detectBlockSize(cipher);
  const mode = aes.modeOracle(cipher);
  if (mode !== 'ecb') {
    throw new Error('Byte-at-a-time decryption only supports ECB.');
  }

  const chunks = chunk(unknownString, blockSize);
  const answers = [];
  for (let paddingSize = 0; paddingSize < blockSize; paddingSize++) {
    try {
      const candidatePlaintext = chunks.reduce((acc, thisBlock) => {
        return acc + attacks.breakKnownPrefixEcb(
          thisBlock.join(''),
          cipher,
          blockSize,
          paddingSize
        );
      }, '');

      answers.push({
        offset: paddingSize,
        plaintext: candidatePlaintext,
        score: scores.commonLetters(candidatePlaintext),
      });
    } catch (e) {
      // failed to decrypt with this padding size.
      if (e.type === 'BadPaddingError' || e.type === 'FailFirstByteError') {
        // no action.
      } else {
        throw e;
      }
    }
  }

  // The truth is, scoring these is now unnecessary with the error exit cases.
  // It should be impossible to get two different offsets that work.
  answers.sort((a, b) => b.score - a.score);
  return answers[0].plaintext;
}

module.exports = {
  run: challengeFourteen,
  describe: 'Byte-at-a-time AES ECB decryption from partially (middle) chosen plaintext.',
};
