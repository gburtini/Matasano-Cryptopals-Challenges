const sha1 = require('js-sha1');
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

  function computeMDPadding(message) {
    const originalLength = message.length;
    while (message.length % 64 !== 56) {
      message += String.fromCharCode(0);
    }

    const byteOne = (Math.max(originalLength - 256, 0) * 8) % 256;
    const byteTwo = (originalLength * 8) % 256;

    console.log(originalLength, byteOne, byteTwo);
    // TODO: how to represent these as packed uint64s?
    message += String.fromCharCode(byteOne);
    message += String.fromCharCode(byteTwo);

    console.log(message.length);
    return message;
  }

  const plaintext = 'comment1=cooking%20MCs;userdata=foo;comment2=%20like%20a%20pound%20of%20bacon';
  const serverResponse = generate(plaintext);
  computeMDPadding(plaintext);

  // TODO: monkeypatch sha1 library.
  // TODO: forge the glue padding and ;admin=true

  return true;
}

module.exports = {
  run: challenge,
  describe: 'Break a SHA-1 keyed MAC using length extension ',
};
