const sha1 = require('../../lib/sha1');
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

  const serverResponse = generate('hello');
  const manipulatedResponse = {
    mac: serverResponse.mac,
    message: 'goodbye',
  };

  assert(serverResponse.mac.length === 40);
  assert(checkMessage(manipulatedResponse) === false);
  assert(checkMessage(serverResponse) === true);
  return true;
}

module.exports = {
  run: challenge,
  describe: 'Implement a SHA1 keyed MAC',
};
