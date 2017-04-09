const scores = require('./scores');
const xor = require('./xor');
const { chunk } = require('./stream');
const lodash = require('lodash');

function findMostLikelyPlaintext(
  ciphertext,
  decrypter = xor.character,
  score = scores.commonLetters
) {
  // Test every potential single character key on this ciphertext.
  const potentials = [];
  for (let asciiOffset = 0; asciiOffset < 128; asciiOffset++) {
    const character = String.fromCharCode(asciiOffset);
    potentials.push({
      characterCandidate: character,
      plainTextCandidate: decrypter(ciphertext, character).toString('ascii'),
    });
  }

  // Pick the one with the highest score. In our application, score is defined by
  // 'most-likely to be English-like' (aka contains most common English letters).
  potentials.sort((a, b) => {
    return score(b.plainTextCandidate) - score(a.plainTextCandidate);
  });

  return potentials[0];
}


function breakRepeatingKeyXor(ciphertext, minKeySize = 2, maxKeySize = 40) {
  const scoredKeySizes = [];

  // First, find the key size by comparing hamming distance of many blocks.
  const replicas = Math.floor(ciphertext.length / maxKeySize);
  for (let keySize = minKeySize; keySize < maxKeySize; keySize++) {
    const distances = [];
    for (let offset = 0; offset < replicas; offset++) {
      const distance = scores.hamming(
        new Buffer(ciphertext.slice(offset * keySize, (offset + 1) * keySize)),
        new Buffer(ciphertext.slice((offset + 1) * keySize, (offset + 2) * keySize))
      ) / keySize;

      distances.push(distance);
    }

    scoredKeySizes.push({
      keySize,
      distance: distances.reduce((acc, val) => acc + val, 0) / replicas,
    });
  }

  scoredKeySizes.sort((a, b) => a.distance - b.distance);

  // The minimum Hamming distance should be our key size. This works because ciphertext
  // should be 'indistinguishable' from randomness, but plaintext has information
  // encoded in it. NOTE: It may not be sufficient to only try one 'best' key length.
  const bestKeySize = scoredKeySizes[0].keySize;


  // Break the ciphertext in to it's effective "repeating key" size, transposed. Remember
  // that our key is of a particular size and then replicated over the plaintext length.
  // We're just trying to get all the values that have been XOR'd with the same
  // character in the key.
  const byteArrays = Array(bestKeySize);
  for (let i = 0; i < (ciphertext.length / bestKeySize); i++) {
    for (let j = 0; j < bestKeySize; j++) {
      if (byteArrays[j] === undefined) byteArrays[j] = [];

      const start = (i * bestKeySize) + j;
      const end = start + 1;
      byteArrays[j].push(
        ciphertext.slice(
          start,
          end
        )
      );
    }
  }

  // For each column (byteArrays), apply our findMostLikelyPlaintext attack to identify the likely
  // key for that column.
  const bests = [];
  for (let i = 0; i < byteArrays.length; i++) {
    bests.push(findMostLikelyPlaintext(
      new Buffer(byteArrays[i].join(''), 'ascii')
    ).characterCandidate);
  }

  // Put the predicted key back together and decrypt.
  const key = bests.join('');
  return xor.key(ciphertext, key).toString('ascii');
}


function breakKnownPrefixEcb(unknownBlock, cipher, blockSize = 16) {
  // Prepare an all-known pad to shift the unknown piece to the
  // beginning of a block.
  const allAs = 'a'.repeat(blockSize);
  let baseString = 'a'.repeat(blockSize);
  for (let j = 0; j < blockSize; j++) {
    const dictionary = {};

    // Drop one character off the front (because we're about to dictionary
    // attack one character deeper off the end).
    baseString = baseString.substring(1);

    // Build a dictionary of blocks with the last byte changed.
    for (let i = 0; i < 256; i++) {
      const extraString = String.fromCharCode(i);
      dictionary[baseString + extraString] = Array.from(
        cipher(baseString + extraString)
      ).join();
    }

    // We now return at least two blocks (our padded first block,
    // and at least one more unknown block). We can only predict
    // the first.
    const firstBlockBytes = chunk(
      Array.from(
        // NOTE: in a real attack, this would be a service that appends
        // unknown block on its own.
        cipher(allAs.substring(j + 1) + unknownBlock)
      ),
      blockSize
    )[0].join();

    // Find the matching plaintext for this block from our dictionary.
    const firstPlaintext = lodash.findKey(
      dictionary,
      lodash.partial(lodash.isEqual, firstBlockBytes)
    );

    // If there is no match, we assume we've hit the end of the ciphertext
    // and strip off all our left-padded single characters.
    if (!firstPlaintext) return baseString.substring(blockSize - j - 1);

    // If there was a match, we continue iterating from this block (which
    // now looks something like AAAAAAAAAACon where "Con" is the valid plaintext.
    baseString = firstPlaintext;
  }
  return baseString;
}


module.exports = {
  findMostLikelyPlaintext,
  breakRepeatingKeyXor,
  breakKnownPrefixEcb,
};
