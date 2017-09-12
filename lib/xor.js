/* eslint-disable no-bitwise */
function xor(a, b) {
  // in: two buffers a and b
  // out: a new buffer that is the xor of a and b.

  if (a.length !== b.length) {
    throw new Error(`a (${a.length}) and b (${b.length}) do not have same length.`);
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
  const longerKey = b.toString('ascii').repeat(replicationTimes);

  const sameLengthKey = longerKey.substring(0, a.length);

  return xor(new Buffer(a), new Buffer(sameLengthKey));
}

function xorRepeatedCharacter(cipher, character) {
  return xorRepeatedKey(cipher, character);
}

module.exports = {
  byte: xor,
  key: xorRepeatedKey,
  character: xorRepeatedCharacter,
};
