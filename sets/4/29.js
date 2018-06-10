const sha1 = require('../../lib/sha1');
const { chunk, naiveStringToBytes, naiveBytesToString } = require('../../lib/stream');

function challenge() {
  const secretKey = naiveStringToBytes('YELLOW SUBMARINE');
  function sha1Mac(message) {
    const msg = secretKey.slice();
    msg.push(...message);
    return sha1(msg);
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

    const highBytes = (originalLength / 4294967296) << 0;
    const bytes = originalLength % 4294967296;

    const buffer = new ArrayBuffer(8);
    const dataView = new DataView(buffer);

    padding.push(0x00);
    padding.push(0x00);

    console.log('a', bytes > 0xffffffffff ? bytes / 0x10000000000 : 0x00);
    console.log('b', bytes > 0xffffffff ? bytes / 0x100000000 : 0x00);
    padding.push(bytes > 0xffffffffff ? bytes / 0x10000000000 : 0x00);
    padding.push(bytes > 0xffffffff ? bytes / 0x100000000 : 0x00);

    for (let s = 24; s >= 0; s -= 8) {
      console.log('c', bytes >> s);

      padding.push(bytes >> s);
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
    const forgedHash = sha1(suffix, h, paddedMessage.length);

    paddedMessage.push(...naiveStringToBytes(suffix));

    return {
      message: paddedMessage,
      hash: forgedHash,
    };
  }

  function forcefullyAppend({ message, mac }, suffix) {
    // for (let i = 1; i < 128; i++) {
    const i = secretKey.length;

    console.log('\n\n\n\n');
    console.log('clean message', message);
    console.log(sha1(message));
    console.log('end clean message');
    const forged = forgeMessage(i, message, mac, suffix);
    console.log(forged);

    console.log('\n\n\n\n');
    // process.exit(0);
    if (checkMessage(forged)) {
      return forged;
    }
    // }

    throw new Error('We failed to find a valid key length.');
  }

  const plaintext = naiveStringToBytes('z');

  const serverResponse = generate(plaintext);
  const forged = forcefullyAppend(serverResponse, ';admin=true');

  return { message: forged.message, passes: checkMessage(forged) };
}

module.exports = {
  run: challenge,
  describe: 'Break a SHA-1 keyed MAC using length extension ',
};
