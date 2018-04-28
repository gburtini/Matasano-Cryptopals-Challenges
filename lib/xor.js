/* eslint-disable no-bitwise */
function xor(a, b) {
  // in: two buffers a and b
  // out: a new buffer that is the xor of a and b.

  if (a.length !== b.length) {
    throw new Error(`a (${a.length}) and b (${b.length}) do not have same length.`);
  }

  if (typeof a !== 'object' || typeof b !== 'object') {
    throw new Error(
      `Invalid types provided to xor. Got ${
        typeof a === 'object' ? typeof b : typeof a
      } but expected Buffer.`
    );
  }

  const retVal = [];
  for (let i = 0; i < a.length; i++) {
    const c = a[i] ^ b[i];
    retVal.push(c);
  }
  return new Buffer(retVal);
}

function xorRepeatedKey(a, b) {
  if (a.length < b.length) {
    return xorRepeatedKey(b, a);
  }

  const replicationTimes = Math.ceil(a.length / b.length);
  const longerKey = b.repeat(replicationTimes);
  const sameLengthKey = longerKey.substring(0, a.length);

  return xor(new Buffer(a, 'ascii'), new Buffer(sameLengthKey, 'ascii'));
}

function xorRepeatedCharacter(cipher, character) {
  return xorRepeatedKey(cipher, character);
}

module.exports = {
  many: (...many) => many.reduce(xor),
  byte: (a, b) => a ^ b,
  bytes: xor, // TODO: this became "bytes" not byte.
  key: xorRepeatedKey,
  character: xorRepeatedCharacter,
};
