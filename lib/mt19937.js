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
const wordSize = 32;

const upperMask = 0x80000000;
const lowerMask = 0x7fffffff;
const initializationConstant = 1812433253;

function b32(v) {
  // truncate to 32 bits.
  const upper = 2 ** wordSize;
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

// function undoLeftXorOld(y, shift) {
//   // y = x ^ (x << s); then this should be y^-1(x)

//   let x = y & ((1 << shift) - 1);
//   for (let i = 0; i < wordSize - shift; i++) {
//     // TODO: understand wtf this condition is.
//     const condition = !!(x & (1 << i)) ^ !!(y & (1 << (shift + i)));

//     if (condition) x |= 1 << (shift + i);
//     else x |= 0 << (shift + i);
//   }
//   return x;
// }

function undoLeftXor(y, shift, mask = 0xffffffff) {
  // y = x ^ (x << s); then this should be y^-1(x)
  let result = 0;
  for (let i = 0; i * shift < 32; i++) {
    const partialMask = (-1 >>> (32 - shift)) << (shift * i);
    const part = y & partialMask;
    y ^= (part << shift) & mask;
    result |= part;
    // result ^= y << (shift * i);
  }
  return result;
}

// x = 311231;
// shift = 7;
// console.log('correct', undoLeftXorOld(x ^ (x << shift), shift));
// console.log('undo and', undoLeftXor(x ^ ((x << shift) & 0xefc60000), shift, 0xefc60000));
// console.log('undo no and', undoLeftXor(x ^ (x << shift), shift));
// console.log('inp unand', x ^ (x << shift));
// console.log('inp and', x ^ ((x << shift) & 0xefc60000));
// console.log('inp and 0xf', x ^ ((x << shift) & 0xffffffff));

function undoRightXor(y, shift) {
  let result = 0;
  for (let i = 0; i < Math.floor(32 / shift) + 1; i++) {
    result ^= y >> (shift * i);
  }
  return result;
}

function untemper(temperedState) {
  // Resources
  // https://stackoverflow.com/questions/31513168/finding-inverse-operation-to-george-marsaglias-xorshift-rng
  // http://krypt05.blogspot.ca/2015/10/reversing-shift-xor-operation.html

  let originalState = temperedState;
  for (let i = temperingBits.length; i > 0; i--) {
    // the opposite of what we did above...
    if (temperingBits[i].shift > 0) {
      originalState = undoLeftXor(originalState, temperingBits[i].shift, temperingBits[i].mask);
    } else {
      originalState = undoRightXor(originalState, temperingBits[i].shift * -1);
    }
  }
  return originalState;
}

function create(seed, originalState) {
  // originalState is an optional argument that sets the first state.
  // should assert that 2^(nw − r) − 1 is a Mersenne prime, but since these are
  // standard constants, they're good.

  let state;
  if (originalState) {
    state = [...originalState];
  } else {
    state = [].fill(0, 0, degreeOfRecurrence);
    state[0] = b32(seed);

    for (let i = 1; i < degreeOfRecurrence; i++) {
      state[i] = b32(initializationConstant * (state[i - 1] ^ (state[i - 1] >> 30)) + i);
    }
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

module.exports = {
  create,
  findSeed,
  findSeedFromObservations,
  untemper,
};
