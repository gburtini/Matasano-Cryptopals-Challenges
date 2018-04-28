const mt19937 = require('./../../lib/mt19937');
const assert = require('assert');

function challenge() {
  const rng = mt19937.create(108123);

  // generate a candidate sequence that is "large enough"
  const candidateSequence = Array(624)
    .fill(0)
    .map(rng);

  const candidateRng = mt19937.clone(candidateSequence);

  assert(candidateRng() === rng());
  assert(candidateRng() === rng());
  assert(candidateRng() === rng());
  return { cloned: candidateRng(), original: rng() };
}

module.exports = {
  run: challenge,
  describe: 'Rebuild MT19937 state from its output.',
};
