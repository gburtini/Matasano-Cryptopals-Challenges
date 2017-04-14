/* eslint-disable no-unused-vars */
const fs = require('fs');
const {
  chunk,
  decodeBase64,
  naiveStringToBytes,
  naiveBytesToString,
} = require('../../lib/stream');
const aes = require('../../lib/aes');
const xor = require('../../lib/xor');
const aesjs = require('aes-js');
const _ = require('lodash');

function challengeThirteen() {
  function readQueryString(queryString) {
    const vars = queryString.split('&');
    const retVal = {};
    vars.forEach((variable) => {
      const kv = variable.split('=');
      retVal[kv[0]] = kv[1];
    });
    return retVal;
  }

  function writeQueryString(object, stripPattern = /[&=]/) {
    let retVal = '';
    Object.keys(object).forEach((key) => {
      const sanitizedKey = key.replace(stripPattern, '');
      const sanitizedValue = object[key].replace(stripPattern, '');

      retVal += `${sanitizedKey}=${sanitizedValue}&`;
    });

    // then strip off final ampersand.
    return retVal.substring(0, retVal.length - 1);
  }

  function profileFor(email) {
    return writeQueryString({
      email,
      uid: '10',
      role: 'user',
    });
  }

  const ecbSettings = {
    key: 'aaaaaaaaaaaaaaaa',
  };

  const originPlaintext = aes.pkcs7Pad(profileFor('foo@bar.com'));
  const ciphertext = naiveBytesToString(
    aes.encrypt.ecb(ecbSettings, originPlaintext)
  );
  const replacement = aes.pkcs7Pad('m&uid=10&role=admin'); // block size rounding here.
  const replacementCipher = naiveBytesToString(
    aes.encrypt.ecb(ecbSettings, replacement)
  );

  const prefix = ciphertext.substring(
    0,
    ciphertext.length - replacementCipher.length
  );
  const compromisedCipher = prefix + replacementCipher;
  const plaintext = naiveBytesToString(
    aes.decrypt.ecb(ecbSettings, compromisedCipher)
  );

  return plaintext;
}

module.exports = {
  run: challengeThirteen,
  describe: 'With ECB mode, an attacker can replace full blocks (partial replay attack).',
};
