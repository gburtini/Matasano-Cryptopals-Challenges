/* eslint-disable no-bitwise */ // this was a great rule. Javascript was the wrong language for this for sure.

const assert = require('assert');

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
      newState ^= ((newState << temperingBits[i].shift) & temperingBits[i].mask) >>> 0;
    } else {
      newState ^= ((newState >>> (-1 * temperingBits[i].shift)) & temperingBits[i].mask) >>> 0;
    }
  }
  return newState;
}

function create(seed, originalState) {
  // originalState is an optional argument that sets the first state.
  // should assert that 2^(nw − r) − 1 is a Mersenne prime, but since these are
  // standard constants, they're good.

  let state;
  let index = 0;
  if (originalState) {
    state = [...originalState];
    index = originalState.length;
  } else {
    state = [].fill(0, 0, degreeOfRecurrence);
    state[0] = b32(seed);

    for (let i = 1; i < degreeOfRecurrence; i++) {
      state[i] = b32(initializationConstant * (state[i - 1] ^ (state[i - 1] >>> 30)) + i);
    }

    index = degreeOfRecurrence; // twist immediately.
  }

  function twist() {
    for (let i = 0; i < degreeOfRecurrence; i++) {
      const twistedUpward =
        (state[i] & upperMask) + (state[(i + 1) % degreeOfRecurrence] & lowerMask);
      state[i] = state[(i + middleWord) % degreeOfRecurrence] ^ (twistedUpward >> 1);

      if (twistedUpward % 2 === 0) {
        state[i] = b32(state[i] & rationalNormalFormTwistCoefficient);
      }
    }
  }

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
  const sequence = [rng(), rng(), rng(), rng()]; //  a much longer sequence than could be collided by chance. This works with n=2, so set n=4.
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

function undoMaskedLeftXor(y, shift, mask = 0xffffffff) {
  // y = x ^ (x << shift) & mask; then this should be y^-1(x)
  let result = 0;
  y = b32(y);
  let workingValue = y;
  for (let i = 0; i * shift < 32; i++) {
    const partialMask = (-1 >>> (32 - shift)) << (shift * i);
    const part = workingValue & partialMask;
    workingValue ^= (part << shift) & mask;
    result |= part;
    // result ^= y << (shift * i);
  }

  result = b32(result);

  assert(
    (result ^ ((result << shift) & mask)) >>> 0 === y,
    `undoMaskedLeftXor did not work for ${y} ${shift} ${mask} (got ${result}, which generates ${result ^
      (((result << shift) & mask) >>> 0)})`
  );
  return result;
}

// x = 3623982100;
// shift = 7;
// console.log('undo and', undoMaskedLeftXor(x ^ ((x << shift) & 0xefc60000), shift, 0xefc60000));
// console.log('undo no and', undoMaskedLeftXor(x ^ (x << shift), shift));
// console.log('expected ', x);
// console.log();
// console.log('inp unand', x ^ (x << shift));
// console.log('inp and', x ^ ((x << shift) & 0xefc60000));
// console.log('inp and 0xf', x ^ ((x << shift) & 0xffffffff));

function undoRightXor(y, shift) {
  let result = 0;
  y = b32(y);

  let workingValue = y;
  for (let i = 0; i * shift < 32; i++) {
    const compartment = (0xffffffff << (32 - shift)) >>> 0;
    const partialMask = (compartment >>> (shift * i)) >>> 0;
    // console.log(i, shift, partialMask);
    const part = workingValue & partialMask;
    workingValue ^= part >>> shift;
    result |= part;
  }

  // impl 10.
  // let workingValue = y;
  // const n = (32 + shift - 1) / shift;
  // let mask = b32((1 << shift) - 1) << (32 - shift);
  // for (let i = 0; i < n; i++) {
  //   workingValue ^= b32((workingValue >>> shift) & mask);
  //   mask >>= shift;
  //   mask = b32(mask);
  // }
  // result = workingValue;

  // for (let i = 0; i < Math.floor(32 / shift) + 1; i++) {
  //   result = b32(result ^ (y >> (shift * i)));
  // }

  result = b32(result);
  assert(
    (result ^ (result >>> shift)) >>> 0 === y,
    `undoRightXor failed for ${y} ${shift}, (got ${result} which generates ${result ^
      ((result >>> shift) >>> 0)})`
  );
  return result;
}
// console.log();
// console.log('right');
// console.log('undo and', undoRightXor(x ^ (x >>> shift), shift));
// console.log('expected', x);
// console.log();
// console.log('inp unand', x ^ (x >>> shift));

function untemper(temperedState) {
  // Resources
  // https://stackoverflow.com/questions/31513168/finding-inverse-operation-to-george-marsaglias-xorshift-rng
  // http://krypt05.blogspot.ca/2015/10/reversing-shift-xor-operation.html

  let originalState = temperedState;
  for (let i = temperingBits.length - 1; i >= 0; i--) {
    // the opposite of what we did above...
    if (temperingBits[i].shift > 0) {
      originalState = undoMaskedLeftXor(
        originalState,
        temperingBits[i].shift,
        temperingBits[i].mask
      );
    } else {
      originalState = undoRightXor(originalState, temperingBits[i].shift * -1);
    }
  }

  assert(
    temper(originalState) >>> 0 === temperedState >>> 0,
    `untemper failed for ${temperedState}`
  );

  return originalState;
}

function clone(sequence) {
  // TODO: can we clone from a partial sequence?
  // TODO: can we clone from a partially observed sequence?

  if (sequence.length < 624) {
    throw new Error('We need at least 624 observations to clone a MT19937.');
  }

  return create(null, sequence.map(untemper));
}

module.exports = {
  create,
  findSeed,
  findSeedFromObservations,
  clone,
};
