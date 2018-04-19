const assert = require('assert');
const mt19937 = require('./../../lib/mt19937');

function challenge() {
  const unixTimestamp = Math.floor(Date.now() / 1000);
  const seededGenerator = mt19937(unixTimestamp);

  function findSeed(rng, lowerSeed = 0, upperSeed = Number.MAX_SAFE_INTEGER) {
    const sequence = [rng(), rng(), rng(), rng()]; //  a much longer sequence than could be collided by chance.

    for (let i = lowerSeed; i < upperSeed; i++) {
      const candidateGenerator = mt19937(i);
      const candidateSequence = sequence.map(() => candidateGenerator());

      if (candidateSequence.toString() === sequence.toString()) {
        return i;
      }
    }

    return null;
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const likelySeed = findSeed(seededGenerator, unixTimestamp - 40, unixTimestamp + 1000);
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
