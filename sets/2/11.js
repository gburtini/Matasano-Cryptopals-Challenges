const { naiveStringToBytes } = require('../../lib/stream');
const aes = require('../../lib/aes');
const aesjs = require('aes-js');

function challengeEleven() {
  const aesMode = (Math.random() < 0.5) ? 'ecb' : 'cbc';

  function randomEncrypt(plaintext) {
    const randomBytes = aes.randomBytes(5 + Math.floor(Math.random() * 5));
    const key = naiveStringToBytes(aes.randomKey());

    return new aesjs.ModeOfOperation[aesMode](key).encrypt(
      naiveStringToBytes(aes.pkcs7Pad(`${randomBytes}${plaintext}${randomBytes}`))
    );
  }

  return {
    actual: aesMode,
    guessed: aes.modeOracle(randomEncrypt),
  };
}

module.exports = {
  run: challengeEleven,
  describe: 'Guess AES mode from arbitrary encrypting function.',
};
