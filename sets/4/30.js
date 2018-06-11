/* eslint-disable no-bitwise */
const md4 = require('../../lib/md4');
const { chunk, naiveStringToBytes, naiveBytesToString, decodeHex } = require('../../lib/stream');
const assert = require('assert');

function challenge() {
  const secretKey = naiveStringToBytes('YELLOW SUBMARINE');
  function sha1Mac(message) {
    const msg = secretKey.slice();
    msg.push(...message);
    return md4(naiveBytesToString(msg));
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
    for (let s = 16; s >= 0; s -= 8) {
      padding.push((totalLength >> s) % 256);
    }

    padding.push(0x00);
    padding.push(0x00);
    padding.push(0x00);

    padding.push(totalLength > 0xffffffffff ? totalLength / 0x10000000000 : 0x00);
    padding.push(totalLength > 0xffffffff ? totalLength / 0x100000000 : 0x00);

    console.log('padding', padding);
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
    console.log('forge', naiveBytesToString(originalMessage), h);
    const forgedHash = md4(suffix, h, (keyLength + paddedMessage.length) * 8);

    paddedMessage.push(...naiveStringToBytes(suffix));

    return {
      message: paddedMessage,
      mac: forgedHash,
    };
  }

  function forcefullyAppend({ message, mac }, suffix) {
    // for (let i = 1; i < 128; i++) {
    const i = secretKey.length;
    const forged = forgeMessage(i, message, mac, suffix);
    console.log(forged);

    // if (checkMessage(forged)) {
    return forged;
    // }
    // }

    throw new Error('We failed to find a valid key length.');
  }

  const plaintext = naiveStringToBytes('zhzhzhzhzhzhzhzh');

  const serverResponse = generate(plaintext);
  console.log(serverResponse);
  const forged = forcefullyAppend(serverResponse, ';admin=true');

  assert(
    forged.message.length === 59,
    `forged message length is wrong, got ${forged.message.length}`
  );

  // forged message string: 7a687a687a687a687a687a687a687a6880000000000000000000000000000000000000000000000000010000000000003b61646d696e3d74727565
  assert(
    decodeHex(
      '7a687a687a687a687a687a687a687a6880000000000000000000000000000000000000000000000000010000000000003b61646d696e3d74727565'
    ).equals(new Buffer(forged.message))
  );
  assert(
    forged.mac === '32a16da18946a4e9963ec9a57e26a637',
    `forged MAC is wrong. got ${forged.mac}.`
  );
  return { message: forged.message, passes: checkMessage(forged) };
}

module.exports = {
  run: challenge,
  describe: 'Break a MD4 keyed MAC using length extension ',
};
