const aes = require('../../lib/aes');

function challengeEleven() {
  const aesMode = Math.random() < 0.5 ? 'ecb' : 'cbc';

  function randomEncrypt(plaintext) {
    const randomBytes = aes.randomBytes(5 + Math.floor(Math.random() * 5));
    const aesSettings = {
      key: aes.randomKey(),
      iv: aes.pkcs7Pad('', 16, '\x00'),
    };

    const augmentedPlaintext = aes.pkcs7Pad(`${randomBytes}${plaintext}${randomBytes}`);
    return aes.encrypt[aesMode](aesSettings, augmentedPlaintext);
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
