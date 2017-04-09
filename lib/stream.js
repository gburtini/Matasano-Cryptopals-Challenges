const decode64 = require('base-64').decode;

function decodeHex(string) {
  return new Buffer(string, 'hex');
}

function naiveStringToBytes(string) {
  if (typeof string !== 'string') {
    throw new Error('naiveStringToBytes: argument must be a string.');
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

function decodeBase64(string) {
  const base64Decoded = decode64(new Buffer(
    string,
    'base64'
  ));

  return new Buffer(naiveStringToBytes(base64Decoded));
}

function chunk(thing, size) {
  function chunkArray(array) {
    const arrays = [];
    for (let i = 0; i < array.length; i++) {
      const j = Math.floor(i / size);
      if (!arrays[j]) arrays[j] = [];
      arrays[j].push(array[i]);
    }

    return arrays;
  }

  function chunkString(string) {
    return chunkArray(string.split(''), size);
  }

  if (Array.isArray(thing) || Buffer.isBuffer(thing)) return chunkArray(thing, size);
  else if (typeof thing === 'string') return chunkString(thing, size);

  throw new Error('chunk: argument must be an array, buffer or string.');
}

module.exports = {
  decodeHex,
  decodeBase64,
  naiveStringToBytes,
  naiveBytesToString,
  chunk,
};
