const aes = require('../../lib/aes');
const xor = require('../../lib/xor');
const { chunk, decodeBase64, naiveBytesToString, naiveStringToBytes } = require('../../lib/stream');
const { arbitraryPad } = require('../../lib/aes');

const INPUT = decodeBase64(
  'L77na/nrFsKvynd6HzOoG7GHTLXsTVu9qvY/2syLXzhPweyyMTJULu/6/kXX0KSvoOLSFQ==',
  'utf8'
);

function challengeEighteen() {
  const nonceCharacter = arbitraryPad('', 8, String.fromCharCode(0));
  const ctrSettings = { key: 'YELLOW SUBMARINE' };
  const chunkedPlaintext = chunk(INPUT, 16);
  const chunkedCiphertext = [];

  for (let counter = 0; counter < chunkedPlaintext.length; counter++) {
    const counterCharacter = arbitraryPad(String.fromCharCode(counter), 8, String.fromCharCode(0));
    const cipheredCounter = aes.encrypt.ecb(ctrSettings, `${nonceCharacter}${counterCharacter}`);

    const appropriateLengthCipheredCounter = naiveStringToBytes(
      naiveBytesToString(cipheredCounter).substr(0, chunkedPlaintext[counter].length)
    );

    chunkedCiphertext.push(xor.many(chunkedPlaintext[counter], appropriateLengthCipheredCounter));
  }

  return chunkedCiphertext.map(naiveBytesToString).join('');
}

module.exports = {
  run: challengeEighteen,
  describe: 'Implement CTR mode.',
};
