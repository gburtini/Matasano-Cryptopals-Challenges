const { chunk } = require('./stream');

function pkcs7Pad(message, length = 16, withCharacter) {
  if (length % message.length === 0) {
    return message;
  }

  const padLength = length - (message.length % length);
  const repeatCharacter = String.fromCharCode(withCharacter || padLength);

  return message + repeatCharacter.repeat(padLength);
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
  // NOTE: alternatively, don't insist on ECB by just looking when the ciphertext size increases.
  // e.g., `cipher('A').length` is the blocksize and if there's a unknown piece added just keep
  // increasing the length of 'A' until the size increases.
  for (let i = 2; i < maxLength; i++) {
    const ciphertext = method('A'.repeat(i * 2));
    if (isEcb(Array.from(ciphertext), i, true)) {
      return i;
    }
  }
  throw new Error('Failed to detect blocksize. Maybe this isn\'t AES-ECB?');
}

module.exports = {
  pkcs7Pad,
  randomBytes,
  randomKey: randomBytes.bind(this, 16),
  isEcb,
  modeOracle,
  detectBlockSize,
};
