const decode64 = require('base-64').decode;

function decodeHex(string) {
  return new Buffer(string, 'hex');
}

// TODO: Refactor the use of all this stuff to use `Buffer` everywhere.
// Many of the headaches from converting back and forth would then go away.
function naiveStringToBytes(string) {
  if (typeof string !== 'string') {
    throw new Error(
      `naiveStringToBytes: argument must be a string, got ${string} as ${typeof string}`
    );
  }

  const byteNumbers = new Array(string.length);
  for (let i = 0; i < string.length; i++) {
    byteNumbers[i] = string.charCodeAt(i);
  }
  return byteNumbers;
}

function naiveBytesToString(array) {
  let string = '';
  for (let i = 0; i < array.length; i++) {
    string += String.fromCharCode(array[i]);
  }
  return string;
}

function decodeBase64(string, enc = 'base64') {
  const base64Decoded = decode64(new Buffer(string, enc));
  return new Buffer(naiveStringToBytes(base64Decoded));
}

function unchunk(thing) {
  return thing.map(i => i.join('')).join('');
}

function chunk(thing, size) {
  if (typeof thing === 'string') return chunk(thing.split(''), size);
  if (!Array.isArray(thing) && !Buffer.isBuffer(thing)) {
    throw new Error('chunk: argument must be an array, buffer or string.');
  }

  const retVal = [];
  for (let i = 0; i < thing.length; i++) {
    const j = Math.floor(i / size);
    if (!retVal[j]) retVal[j] = [];
    retVal[j].push(thing[i]);
  }
  return retVal;
}

module.exports = {
  decodeHex,
  decodeBase64,
  naiveStringToBytes,
  naiveBytesToString,
  chunk,
  unchunk,
};
