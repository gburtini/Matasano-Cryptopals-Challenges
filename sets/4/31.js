const sha1 = require('../../lib/sha1');
const xor = require('../../lib/xor');
const { arbitraryPad } = require('../../lib/aes');
const assert = require('assert');

function boxMuller(mean, variance) {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return mean + Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * variance;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function challenge() {
  const secretKey = 'YELLOW SUBMARINE';

  const hash = sha1;
  const blockSize = 64;
  const outputSize = 40;
  const outerPadding = 0x5c;
  const innerPadding = 0x36;
  function hmac(key, message) {
    if (key.length > blockSize) {
      key = hash(key);
    }

    if (key.length < blockSize) {
      key = arbitraryPad(key, blockSize, 0x00);
    }

    const outerKey = xor
      .bytes(new Buffer(key), new Buffer(String(outerPadding).repeat(blockSize / 2)))
      .toString();
    const innerKey = xor
      .bytes(new Buffer(key), new Buffer(String(innerPadding).repeat(blockSize / 2)))
      .toString();

    return hash(outerKey + hash(innerKey + message));
  }

  function server(file, signature) {
    async function insecureCompare(a, b, delayMean = 10, delayVariance = 0) {
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
        const delay = boxMuller(delayMean, delayVariance);
        await sleep(delay);
        // console.log('Slept for ', delay);
      }
      return true;
    }

    const correctSignature = hmac(secretKey, file);
    return insecureCompare(correctSignature, signature);
  }

  let guess = '0'.repeat(outputSize);

  function replaceAt(string, index, replacement) {
    return string.substr(0, index) + replacement + string.substr(index + replacement.length);
  }

  const fileTested = 'some file';
  async function timeGuess(guess) {
    const before = Date.now();
    await server(fileTested, guess);
    const after = Date.now();
    return after - before;
  }

  for (let j = 0; j < outputSize; j++) {
    let bestGuess = '';
    let bestGuessValue = 0;

    for (let i = 0; i < 16; i++) {
      guess = replaceAt(guess, j, i.toString(16));
      const guessTime = await timeGuess(guess);

      if (guessTime > bestGuessValue) {
        bestGuess = guess;
        bestGuessValue = guessTime;
      }
    }

    guess = bestGuess;
  }
  assert(
    guess === hmac(secretKey, fileTested),
    `Tried ${guess} but expected ${hmac(secretKey, fileTested)}`
  );
  return guess;
}

module.exports = {
  run: challenge,
  describe: 'Implement and break HMAC-SHA1 with an artificial timing leak ',
};
