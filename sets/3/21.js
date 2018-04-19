// const BN = require('bn.js'); // this probably isn't necessary for MT19937, definitely for MT19937-64 though.
const assert = require('assert');
/* eslint-disable no-bitwise */
function b32(v) {
  // truncate to 32 bits.
  return (v % 2 ** 32) >>> 0;
}
function challengeTwentyOne() {
  function createMT(seed) {
    const degreeOfRecurrence = 624; // n
    const middleWord = 397; // m: middle word, an offset used in the recurrence relation defining the series x, 1 ≤ m < n

    const rationalNormalFormTwistCoefficient = 0x9908b0df; // also called "a".
    const temperingBits = [
      // these are constants used to implement the "tempering transform"
      // https://en.wikipedia.org/wiki/Tempered_representation
      // negative signs are used to encode left shifts.
      { mask: 0xffffffff, shift: -11 }, // u, d
      { mask: 0x9d2c5680, shift: 7 }, // b, s
      { mask: 0xefc60000, shift: 15 }, // c, t
      { mask: 0xffffffff, shift: -18 }, //  l.
    ];

    const upperMask = 0x80000000;
    const lowerMask = 0x7fffffff;
    const initializationConstant = 1812433253;

    // TODO: assert that 2^(nw − r) − 1 is a Mersenne prime.
    const state = [].fill(0, 0, degreeOfRecurrence);
    state[0] = b32(seed);

    for (let i = 1; i < degreeOfRecurrence; i++) {
      state[i] = b32(initializationConstant * (state[i - 1] ^ (state[i - 1] >> 30)) + i);
    }

    function twist() {
      for (let i = 0; i < degreeOfRecurrence; i++) {
        const twistedUpward =
          (state[i] & upperMask) + (state[(i + 1) % degreeOfRecurrence] & lowerMask);
        state[i] = state[(i + middleWord) % degreeOfRecurrence] ^ (twistedUpward >> 1);

        if (twistedUpward % 2 === 0) {
          state[i] &= rationalNormalFormTwistCoefficient;
        }
      }
    }

    function temper(currentState) {
      let newState = currentState;
      for (let i = 0; i < temperingBits.length; i++) {
        if (temperingBits[i].shift > 0) {
          newState ^= (newState << temperingBits[i].shift) & temperingBits[i].mask;
        } else {
          newState ^= (newState >>> (-1 * temperingBits[i].shift)) & temperingBits[i].mask;
        }
      }
      return newState;
    }

    let index = degreeOfRecurrence;
    return () => {
      if (index >= degreeOfRecurrence) {
        twist();
        index = 0;
      }

      const y = temper(state[index]);
      index += 1;
      return b32(y);
    };
  }

  // This successfully generates good numbers. I think.
  const test = createMT(1);
  const points = [];
  for (let i = 0; i < 32000; i++) {
    points.push([test(), test()]);
  }

  // Test by computing a^2 + b^2 <= 2^64 for two randoms.
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
