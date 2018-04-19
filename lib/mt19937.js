/* eslint-disable no-bitwise */

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

function b32(v) {
  // truncate to 32 bits.
  const upper = 2 ** 32;
  return (v % upper) >>> 0;
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
function untemper(temperedState) {}

function create(seed) {
  // should assert that 2^(nw − r) − 1 is a Mersenne prime, but since these are
  // standard constants, they're good.

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

function findSeed(rng, lowerSeed = 0, upperSeed = Number.MAX_SAFE_INTEGER) {
  const sequence = [rng(), rng(), rng(), rng()]; //  a much longer sequence than could be collided by chance.
  return findSeedFromObservations(sequence, lowerSeed, upperSeed, 1);

  /*
  for (let i = lowerSeed; i < upperSeed; i++) {
    const candidateGenerator = create(i);
    const candidateSequence = sequence.map(() => candidateGenerator());

    if (candidateSequence.toString() === sequence.toString()) {
      return i;
    }
  }

  return null;
  */
}

// This method lets me still find the seed if I only get a stochastic amount of the RNG sequence.
function findSeedFromObservations(
  sequence,
  lowerSeed = 0,
  upperSeed = Number.MAX_SAFE_INTEGER,
  observationProbability = 0.01
) {
  for (let i = lowerSeed; i < upperSeed; i++) {
    const candidateGenerator = create(i);

    // generate a candidate sequence that is "large enough"
    const candidateSequence = Array(sequence.length / observationProbability)
      .fill(0)
      .map(() => candidateGenerator());

    let lowestIndex = 0;
    if (
      sequence.every((j) => {
        const foundAt = candidateSequence.indexOf(j, lowestIndex);
        lowestIndex = foundAt;

        if (foundAt === -1) return false;
        return true;
      })
    ) {
      return i;
    }
  }

  return null;
}

module.exports = {
  create,
  findSeed,
  findSeedFromObservations,
};