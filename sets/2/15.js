const { stripPkcs7Pad } = require('../../lib/aes');
const assert = require('assert');

function challengeFifteen() {
  const invalidStrings = ['ICE ICE BABY\x05\x05\x05\x05', 'ICE ICE BABY\x01\x02\x03\x04'];

  invalidStrings.forEach((invalidString) => {
    assert.throws(() => {
      stripPkcs7Pad(invalidString);
    }, Error);
  });

  const string = 'ICE ICE BABY\x04\x04\x04\x04';
  const stripped = stripPkcs7Pad(string);
  assert.equal(stripped, 'ICE ICE BABY');

  return stripped;
}

module.exports = {
  run: challengeFifteen,
  describe: 'Correctly strip PKCS7 padding.',
};
