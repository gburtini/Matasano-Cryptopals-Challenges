const aesjs = require('aes-js');
const { chunk, naiveStringToBytes, naiveBytesToString } = require('./stream');
const xor = require('./xor');

function arbitraryPad(message, length = 16, withCharacter = undefined) {
  if (message.length % length === 0 && message.length > length) {
    // TODO: This is wrong, but it works everywhere... pkcs7 requires a full block in this case.
    return message;
  }

  const missingLength = message.length % length;
  const padLength = length - missingLength;
  const repeatCharacter = String.fromCharCode(withCharacter || padLength);

  return message + repeatCharacter.repeat(padLength);
}

function pkcs7Pad(message, length = 16) {
  return arbitraryPad(message, length);
}

function stripPkcs7Pad(message) {
  if (typeof message !== 'string') {
    throw new Error('Invalid type for message.');
  }

  const finalCharacter = message[message.length - 1];
  const i = finalCharacter.charCodeAt(0);
  if (i > 16) throw new Error('Padding byte out of range.');

  const foundPadding = message.substring(message.length - i);
  const expectedPadding = finalCharacter.repeat(i);

  if (i === 0 || foundPadding !== expectedPadding) {
    throw new Error(`Invalid padding on ${message}.`);
  }

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

  const plainBytes = typeof plaintext === 'string' ? naiveStringToBytes(plaintext) : plaintext;
  // TODO: it seems to me this should naiveBytesToString back if plaintext was string.
  return strategyInstance[methodCall](plainBytes);
}

function aesCtr({ key, nonce }, plaintext, startingOffset = 0) {
  if (nonce.length !== 8) {
    throw new Error('Invalid nonce length. Must be exactly 8 characters for this implementation.');
  }

  const chunkedPlaintext = chunk(plaintext, 16);
  const chunkedCiphertext = [];

  if (chunkedPlaintext.length === 0) {
    throw new Error(`There are no 16 byte chunks in the plaintext: ${plaintext}`);
  }
  if (startingOffset >= chunkedPlaintext.length) {
    // NOTE: this works for decrypting but doesn't let me recrypt a piece. It is certainly possible, but requires
    // a refactor of the main loop.
    throw new Error(
      'Starting offset set too high. Cannot be larger than the number of 16 byte blocks.'
    );
  }

  for (let counter = startingOffset; counter < chunkedPlaintext.length; counter++) {
    const counterCharacter = arbitraryPad(String.fromCharCode(counter), 8, String.fromCharCode(0));
    const cipheredCounter = aesLambda(
      k => new aesjs.ModeOfOperation.ecb(k),
      'encrypt',
      { key },
      `${nonce}${counterCharacter}`
    );

    const appropriateLengthCipheredCounter = naiveStringToBytes(
      naiveBytesToString(cipheredCounter).substr(0, chunkedPlaintext[counter].length)
    );

    chunkedCiphertext.push(xor.many(chunkedPlaintext[counter], appropriateLengthCipheredCounter));
  }

  return chunkedCiphertext.map(naiveBytesToString).join('');
}
module.exports = {
  arbitraryPad,
  pkcs7Pad,
  stripPkcs7Pad,
  randomBytes,
  randomKey: randomBytes.bind(this, 16),
  isEcb,
  modeOracle,
  detectBlockSize,
  encrypt: {
    ecb: aesLambda.bind(this, key => new aesjs.ModeOfOperation.ecb(key), 'encrypt'),
    cbc: aesLambda.bind(this, (key, iv) => new aesjs.ModeOfOperation.cbc(key, iv), 'encrypt'),
    ctr: aesCtr,
    ctrNative: aesLambda.bind(this, key => new aesjs.ModeOfOperation.ctr(key), 'encrypt'),
  },
  decrypt: {
    ecb: aesLambda.bind(this, key => new aesjs.ModeOfOperation.ecb(key), 'decrypt'),
    cbc: aesLambda.bind(this, (key, iv) => new aesjs.ModeOfOperation.cbc(key, iv), 'decrypt'),
    ctr: aesCtr,
    ctrNative: aesLambda.bind(this, key => new aesjs.ModeOfOperation.ctr(key), 'decrypt'),
  },
};
