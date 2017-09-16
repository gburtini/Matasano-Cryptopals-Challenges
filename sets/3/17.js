const assert = require('assert');

const aes = require('../../lib/aes');
const xor = require('../../lib/xor');
const { chunk, naiveBytesToString, naiveStringToBytes, decodeBase64 } = require('../../lib/stream');

const INPUT_STRINGS = [
  'MDAwMDAwTm93IHRoYXQgdGhlIHBhcnR5IGlzIGp1bXBpbmc=',
  'MDAwMDAxV2l0aCB0aGUgYmFzcyBraWNrZWQgaW4gYW5kIHRoZSBWZWdhJ3MgYXJlIHB1bXBpbic=',
  'MDAwMDAyUXVpY2sgdG8gdGhlIHBvaW50LCB0byB0aGUgcG9pbnQsIG5vIGZha2luZw==',
  'MDAwMDAzQ29va2luZyBNQydzIGxpa2UgYSBwb3VuZCBvZiBiYWNvbg==',
  'MDAwMDA0QnVybmluZyAnZW0sIGlmIHlvdSBhaW4ndCBxdWljayBhbmQgbmltYmxl',
  'MDAwMDA1SSBnbyBjcmF6eSB3aGVuIEkgaGVhciBhIGN5bWJhbA==',
  'MDAwMDA2QW5kIGEgaGlnaCBoYXQgd2l0aCBhIHNvdXBlZCB1cCB0ZW1wbw==',
  'MDAwMDA3SSdtIG9uIGEgcm9sbCwgaXQncyB0aW1lIHRvIGdvIHNvbG8=',
  'MDAwMDA4b2xsaW4nIGluIG15IGZpdmUgcG9pbnQgb2g=',
  'MDAwMDA5aXRoIG15IHJhZy10b3AgZG93biBzbyBteSBoYWlyIGNhbiBibG93',
]
  .map(str => decodeBase64(str, 'utf8'))
  .map(naiveBytesToString);

function challengeSeventeen() {
  const cbcSettings = {
    key: aes.randomKey(),
    iv: aes.arbitraryPad('', 16, '\x00'),
  };

  function cipher(index) {
    // Select at random, one of the 10 strings, then properly CBC encrypt. This should
    // again be interpreted as being a black box web server type interaction.
    const randomIndex = Math.floor(Math.random() * INPUT_STRINGS.length);
    const string = INPUT_STRINGS[index || randomIndex];

    return naiveBytesToString(aes.encrypt.cbc(cbcSettings, aes.pkcs7Pad(string)));
  }

  function oracle(string) {
    // this takes an AES encrypted string and returns whether padding was valid or not.
    const decryptedString = naiveBytesToString(aes.decrypt.cbc(cbcSettings, string));

    try {
      aes.stripPkcs7Pad(decryptedString);
      return true;
    } catch (e) {
      return false;
    }
  }

  function recoverOneBlock(block, previousBlock) {
    const knownCharacters = [];
    for (let characterOffset = 0; characterOffset < 16; characterOffset++) {
      const manipulatedBlock = previousBlock.substr(0, previousBlock.length - characterOffset);
      if (knownCharacters.length < characterOffset - 1) {
        // Either something went wrong, or we've run out of bytes to decrypt.
        break;
      }

      for (
        let asciiOffset = 1;
        asciiOffset < 255 && knownCharacters.length <= characterOffset - 1;
        asciiOffset++
      ) {
        const guessedCharacter = String.fromCharCode(asciiOffset);

        const manipulatedByte = naiveBytesToString(
          xor.many(
            naiveStringToBytes(previousBlock.substr(-1 * characterOffset)),
            naiveStringToBytes(
              guessedCharacter +
                knownCharacters
                  .slice()
                  .reverse()
                  .join('')
            ),
            // expected actual padding.
            naiveStringToBytes(String.fromCharCode(characterOffset).repeat(characterOffset))
          )
        );

        const testBlocks = manipulatedBlock + manipulatedByte + block;

        if (oracle(testBlocks)) {
          if (characterOffset === 1) {
            // TODO: it is possible we've got the wrong byte here.
          }
          knownCharacters.push(guessedCharacter);
        } else if (asciiOffset === 255) {
          throw new Error(`Failed to decode byte ${characterOffset}`);
        }
      }
    }
    return knownCharacters
      .slice()
      .reverse()
      .join('');
  }

  for (let i = 1; i < INPUT_STRINGS.length; i++) {
    console.log('\nMessage', i);
    const ciphertext = cipher(i);
    const chunkedCiphertext = chunk(ciphertext, 16).map(j => j.join(''));
    console.log(chunkedCiphertext.length);
    let plaintext = '';
    for (let chunkIndex = 0; chunkIndex < chunkedCiphertext.length; chunkIndex++) {
      plaintext += recoverOneBlock(
        chunkedCiphertext[chunkIndex],
        chunkedCiphertext[chunkIndex - 1] || cbcSettings.iv
      );
    }
    console.log('Plaintext', i, 'recovered:', plaintext);
  }
}
// challengeSeventeen();

module.exports = {
  run: challengeSeventeen,
  describe: 'Attack CBC with padding oracle attack.',
};
