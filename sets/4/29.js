/* eslint-disable no-bitwise */
const sha1 = require('../../lib/sha1');
const { chunk, naiveStringToBytes } = require('../../lib/stream');

function challenge() {
  const secretKey = naiveStringToBytes('YELLOW SUBMARINE');
  function sha1Mac(message) {
    const msg = secretKey.slice();
    msg.push(...message);
    return sha1(new Buffer(msg));
  }
  function checkMessage({ message, mac }) {
    return sha1Mac(message) === mac;
  }
  function generate(message) {
    return {
      message,
      mac: sha1Mac(message),
    };
  }

  function generatePadding(messageLength) {
    const originalLength = messageLength;
    const padding = [0x80];
    while ((messageLength + padding.length) % 64 !== 56) {
      padding.push(0x00);
    }

    const totalLength = (originalLength * 8) % 4294967296;

    padding.push(0x00);
    padding.push(0x00);

    padding.push(totalLength > 0xffffffffff ? totalLength / 0x10000000000 : 0x00);
    padding.push(totalLength > 0xffffffff ? totalLength / 0x100000000 : 0x00);

    for (let s = 24; s >= 0; s -= 8) {
      padding.push((totalLength >> s) % 256);
    }

    return padding;
  }

  function generateStateFromHash(hash) {
    return chunk(hash, 8).map(i => parseInt(i.join(''), 16));
  }

  function forgeMessage(keyLength, originalMessage, originalHash, suffix) {
    const padding = generatePadding(keyLength + originalMessage.length);
    const paddedMessage = originalMessage.slice();
    paddedMessage.push(...padding);

    const h = generateStateFromHash(originalHash);

    const forgedHash = sha1(new Buffer(suffix), h, (keyLength + paddedMessage.length) * 8);

    paddedMessage.push(...naiveStringToBytes(suffix));

    return {
      message: paddedMessage,
      mac: forgedHash,
    };
  }

  function forcefullyAppend({ message, mac }, suffix) {
    for (let i = 1; i < 128; i++) {
      const forged = forgeMessage(i, message, mac, suffix);
      if (checkMessage(forged)) {
        return forged;
      }
    }

    throw new Error('We failed to find a valid key length.');
  }

  const plaintext = naiveStringToBytes('zhzhzhzhzhzhzhzh');

  const serverResponse = generate(plaintext);
  const forged = forcefullyAppend(serverResponse, ';admin=true');

  return { message: forged.message, passes: checkMessage(forged) };
}

module.exports = {
  run: challenge,
  describe: 'Break a SHA-1 keyed MAC using length extension ',
};
