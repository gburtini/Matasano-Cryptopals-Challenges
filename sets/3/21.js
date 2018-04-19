// const BN = require('bn.js'); // this probably isn't necessary for MT19937, definitely for MT19937-64 though.
const assert = require('assert');
const mt19937 = require('./../../lib/mt19937');

function challengeTwentyOne() {
  // This successfully generates good numbers. I think.
  const test = mt19937.create(1);
  const points = [];
  for (let i = 0; i < 32000; i++) {
    points.push([test(), test()]);
  }

  // Test by computing a^2 + b^2 <= 2^64 for two randoms... testing idea from this guy: https://medium.com/@__cpg/cryptopals-3-mt19937-bf0e8f209741
  const total = points
    .map((set) => {
      // I think this overflows.
      return set[0] ** 2 + set[1] ** 2 <= 2 ** 64;
    })
    .reduce((acc, val) => (val ? acc + 1 : acc), 0);

  assert(Math.abs(total / 32000 - Math.PI / 4) < 0.05);
  return test();
}

module.exports = {
  run: challengeTwentyOne,
  describe: 'Implement MT19937.',
};
