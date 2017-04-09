const { decodeHex } = require('../../lib/stream');

function challengeOne() {
  const base64String = decodeHex(
    // eslint-disable-next-line max-len
    '49276d206b696c6c696e6720796f757220627261696e206c696b65206120706f69736f6e6f7573206d757368726f6f6d'
  ).toString('base64');
  return base64String;
}

module.exports = {
  run: challengeOne,
  describe: 'Convert a hex string to base64 encoded.',
};
