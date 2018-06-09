const sha1 = require('../../lib/sha1');
const { chunk } = require('../../lib/stream');
const assert = require('assert');

function challenge() {
  const secretKey = 'YELLOW SUBMARINE';
  function sha1Mac(message) {
    return sha1(`${secretKey}${message}`);
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
    let padding = '\x80'; // TODO: why?
    while ((messageLength + padding.length) % 64 !== 56) {
      padding += '\x00';
    }

    const highBytes = (originalLength / 4294967296) << 0;
    const bytes = originalLength % 4294967296;

    const buffer = new ArrayBuffer(8);
    const dataView = new DataView(buffer);
    dataView.setInt32(0, (highBytes << 3) | (bytes >>> 29));
    dataView.setInt32(4, bytes << 3);
    padding += new Buffer(new Uint8Array(buffer)).toString();

    return padding;
  }

  function generateStateFromHash(hash) {
    return chunk(hash, 8).map(i => parseInt(i.join(''), 16));
  }

  function forgeMessage(keyLength, originalMessage, originalHash, suffix) {
    const padding = generatePadding(keyLength + originalMessage.length);
    const paddedMessage = `${originalMessage}${padding}${suffix}`;

    const h = generateStateFromHash(originalHash);
    const forgedHash = sha1(suffix, h, keyLength + paddedMessage.length);

    return {
      message: paddedMessage,
      hash: forgedHash,
    };
  }

  function forcefullyAppend({ message, mac }, suffix) {
    for (let i = 1; i < 128; i++) {
      const forged = forgeMessage(i, message, mac, suffix);
      console.log(forged);
      if (checkMessage(forged)) {
        return forged;
      }
    }

    throw new Error('We failed to find a valid key length.');
  }

  const plaintext = 'comment1=cooking%20MCs;userdata=foo;comment2=%20like%20a%20pound%20of%20bacon';

  const serverResponse = generate(plaintext);
  const forged = forcefullyAppend(serverResponse, ';admin=true');

  return { message: forged.message, passes: checkMessage(forged) };
}

module.exports = {
  run: challenge,
  describe: 'Break a SHA-1 keyed MAC using length extension ',
};
