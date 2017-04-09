/* eslint-disable no-unused-vars */
const fs = require('fs');
const { chunk, decodeBase64, naiveStringToBytes, naiveBytesToString } = require('../../lib/stream');
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

  const encryptionLibrary = new aesjs.ModeOfOperation.ecb(naiveStringToBytes('aaaaaaaaaaaaaaaa'));
  const ciphertext = naiveBytesToString(encryptionLibrary.encrypt(
    naiveStringToBytes(aes.pkcs7Pad(profileFor('foo@bar.com')))
  ));
  const replacement = 'm&uid=10&role=admin';  // block size rounding here.
  const replacementCipher = naiveBytesToString(
    encryptionLibrary.encrypt(
      naiveStringToBytes(aes.pkcs7Pad(replacement))
    )
  );

  const prefix = ciphertext.substring(0, ciphertext.length - replacementCipher.length);
  const compromisedCipher = prefix + replacementCipher;
  const plaintext = naiveBytesToString(encryptionLibrary.decrypt(
    naiveStringToBytes(compromisedCipher)
  ));

  return plaintext;
}

module.exports = {
  run: challengeThirteen,
  describe: 'With ECB mode, an attacker can replace full blocks (partial replay attack).',
};
