const { chunk } = require('./stream');
const aesjs = require('aes-js');
const { naiveStringToBytes } = require('./stream');

function pkcs7Pad(message, length = 16, withCharacter) {
  if (message.length % length === 0 && message.length > length) {
    return message;
  }

  const padLength = length - message.length % length;
  const repeatCharacter = String.fromCharCode(withCharacter || padLength);

  return message + repeatCharacter.repeat(padLength);
}

function stripPkcs7Pad(message) {
  const finalCharacter = message[message.length - 1];
  const i = finalCharacter.charCodeAt(0);
  const foundPadding = message.substring(message.length - i);
  const expectedPadding = finalCharacter.repeat(i);

  if (foundPadding !== expectedPadding) { throw new Error(`Invalid padding on ${message}.`); }

  return message.substring(0, message.length - i);
}

function randomBytes(n) {
  let bytes = '';

  for (let i = 0; i < n; i++) {
    bytes += String.fromCharCode(Math.floor(Math.random() * 256));
  }

  return bytes;
}

function isEcb(plaintext, blockSize = 16, sequentialOnly = false) {
  // TODO: this is two functions IMO. Refactor to not use `sequentialOnly` parameter.
  const blocks = chunk(plaintext, blockSize);

  if (sequentialOnly) {
    for (let i = 0; i < blocks.length - 1; i++) {
      if (JSON.stringify(blocks[i]) === JSON.stringify(blocks[i + 1])) {
        return true;
      }
    }
  } else {
    for (let i = 0; i < blocks.length; i++) {
      for (let j = 0; j < blocks.length; j++) {
        if (i === j) continue; // eslint-disable-line no-continue

        if (JSON.stringify(blocks[i]) === JSON.stringify(blocks[j])) {
          return true;
        }
      }
    }
  }
  return false;
}

function modeOracle(method) {
  const plaintext = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const ciphertext = method(plaintext);
  return isEcb(Array.from(ciphertext)) ? 'ecb' : 'cbc';
}

function detectBlockSize(method, maxLength = 64) {
  const startingSize = method('aa').length;
  for (let i = 2; i < maxLength; i++) {
    const ciphertext = method('a'.repeat(i));
    if (ciphertext.length > startingSize) {
      return ciphertext.length - startingSize;
    }
  }
  throw new Error("Failed to detect blocksize. Maybe this isn't AES-ECB?");
}

/**
 * The first two arguments get bound in the export and define a nice interface for working with
 * aes-js. This is a little obtuse in interest of conciseness.
 *
 * @param {Function (...) => aesjs.ModeOfOperation} strategyGenerator  a generator for an AES mode.
 * @param {string} methodCall  one of 'encrypt' or 'decrypt'
 * @param {object} strategyOptions { key, iv, ... }
 * @param {string | Array} plaintext
 */
function aesLambda(strategyGenerator, methodCall, strategyOptions, plaintext) {
  const strategyInstance = strategyGenerator(
    naiveStringToBytes(strategyOptions.key),
    naiveStringToBytes(strategyOptions.iv || '')
  );

  const plainBytes = typeof plaintext === 'string'
    ? naiveStringToBytes(plaintext)
    : plaintext;
  // TODO: it seems to me this should naiveBytesToString back.
  return strategyInstance[methodCall](plainBytes);
}

module.exports = {
  pkcs7Pad,
  stripPkcs7Pad,
  randomBytes,
  randomKey: randomBytes.bind(this, 16),
  isEcb,
  modeOracle,
  detectBlockSize,
  encrypt: {
    ecb: aesLambda.bind(
      this,
      key => new aesjs.ModeOfOperation.ecb(key),
      'encrypt'
    ),
    cbc: aesLambda.bind(
      this,
      (key, iv) => new aesjs.ModeOfOperation.cbc(key, iv),
      'encrypt'
    ),
  },
  decrypt: {
    ecb: aesLambda.bind(
      this,
      key => new aesjs.ModeOfOperation.ecb(key),
      'decrypt'
    ),
    cbc: aesLambda.bind(
      this,
      (key, iv) => new aesjs.ModeOfOperation.cbc(key, iv),
      'decrypt'
    ),
  },
};
