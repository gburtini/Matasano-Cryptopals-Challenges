const assert = require('assert');
const mt19937 = require('./../../lib/mt19937');

function challenge() {
  const unixTimestamp = Math.floor(Date.now() / 1000);
  const seededGenerator = mt19937.create(unixTimestamp);

  return new Promise((resolve) => {
    setTimeout(() => {
      const likelySeed = mt19937.findSeed(
        seededGenerator,
        Math.floor(Date.now() / 1000) - 1000,
        Math.floor(Date.now() / 1000) + 10000
      );
      console.log('Likely seed found', likelySeed, 'actual seed was', unixTimestamp);
      assert(likelySeed === unixTimestamp);
      resolve(likelySeed);
    }, Math.random() * 1000); // sleep for a while.
  });
}

module.exports = {
  run: challenge,
  describe: 'Find MT19937 seed in small seed space.',
};
