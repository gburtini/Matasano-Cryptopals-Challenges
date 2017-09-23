const aes = require('../../lib/aes');
const { decodeBase64 } = require('../../lib/stream');
const { arbitraryPad } = require('../../lib/aes');

const INPUT = decodeBase64(
  'L77na/nrFsKvynd6HzOoG7GHTLXsTVu9qvY/2syLXzhPweyyMTJULu/6/kXX0KSvoOLSFQ==',
  'utf8'
);

function challengeEighteen() {
  const nonceCharacter = arbitraryPad('', 8, String.fromCharCode(0));
  const ctrSettings = { key: 'YELLOW SUBMARINE', nonce: nonceCharacter };
  return aes.decrypt.ctr(ctrSettings, INPUT);
}

module.exports = {
  run: challengeEighteen,
  describe: 'Implement CTR mode.',
};
