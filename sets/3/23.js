const assert = require('assert');
const mt19937 = require('./../../lib/mt19937');

function challenge() {}

module.exports = {
  run: challenge,
  describe: 'Rebuild MT19937 state from its output.',
};
