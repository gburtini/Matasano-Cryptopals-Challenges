const aes = require('../../lib/aes');
const assert = require('assert');

function challengeNine() {
  const retVal = aes.pkcs7Pad('YELLOW SUBMARINE', 20, 'x');
  assert.equal(retVal.length, 20);
  return retVal;
}

module.exports = {
  run: challengeNine,
  describe: 'Pad YELLOW SUBMARINE to 20 bytes.',
};
