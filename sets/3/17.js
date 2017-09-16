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
    if (index === undefined) index = randomIndex;
    const string = INPUT_STRINGS[index];

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

  function recoverOneCharacter(
    previousBlock,
    i,
    before,
    after,
    nextBlock,
    backtrackInvalidValues = []
  ) {
    for (
      let asciiOffset = 1;
      asciiOffset < 256 && after.length < i; // the whole characterset range AND we have not learned enough yet.
      asciiOffset++
    ) {
      const guessedCharacter = String.fromCharCode(asciiOffset);

      const manipulatedByte = naiveBytesToString(
        xor.many(
          naiveStringToBytes(before),
          naiveStringToBytes(guessedCharacter + after),
          // expected actual padding.
          naiveStringToBytes(String.fromCharCode(i).repeat(i))
        )
      );

      const testBlocks = previousBlock + manipulatedByte + nextBlock;

      if (oracle(testBlocks)) {
        if (backtrackInvalidValues.includes(guessedCharacter)) continue;
        return guessedCharacter;
      } else if (asciiOffset === 255) {
        throw new Error(`Failed to decode byte ${i}.`);
      }
    }
    return false;
  }

  function recoverOneBlock(block, previousBlock) {
    const knownCharacters = [];
    let knownInvalid = [];
    for (let characterOffset = 1; characterOffset <= 16; characterOffset++) {
      const manipulatedBlock = previousBlock.substr(0, previousBlock.length - characterOffset);
      try {
        knownCharacters.push(
          recoverOneCharacter(
            manipulatedBlock,
            characterOffset,
            previousBlock.substr(-1 * characterOffset),
            knownCharacters
              .slice()
              .reverse()
              .join(''),
            block,
            knownInvalid
          )
        );
        knownInvalid = []; // reset the invalids.
      } catch (e) {
        // A backtracking step to handle the chance case; it is possible, for example, for a block to happen to end in [0x01] or [0x02, 0x02].
        // So we advance in that case, and try to solve the next byte. If we fail, we step back and blacklist the character. There are other
        // solutions that "work," but it is actually possible but extremely unlikely to get [0x05, 0x05, 0x05, 0x05, 0x05], and this will handle that.
        if (knownCharacters.length) {
          knownInvalid.push(knownCharacters[knownCharacters.length - 1]);
          // console.log('Calling ', knownInvalid, ' invalid and rewinding');
          delete knownCharacters[knownCharacters.length - 1];
          characterOffset -= 2;
        } else {
          throw e;
        }
      }
    }

    return knownCharacters
      .slice()
      .reverse()
      .join('');
  }

  for (let i = 0; i < INPUT_STRINGS.length; i++) {
    const ciphertext = cipher(i);
    const chunkedCiphertext = chunk(ciphertext, 16).map(j => j.join(''));
    let plaintext = '';
    for (let chunkIndex = 0; chunkIndex < chunkedCiphertext.length; chunkIndex++) {
      try {
        plaintext += recoverOneBlock(
          chunkedCiphertext[chunkIndex],
          chunkedCiphertext[chunkIndex - 1] || cbcSettings.iv
        );
      } catch (e) {
        // rethrow as a user friendly error.
        throw new Error(
          `Failed (${e.message}) to decrypt text ${i} - before failing, got: ${plaintext}.`
        );
      }
    }
    console.log('Plaintext', i, 'recovered:', plaintext);
  }
}
challengeSeventeen();

module.exports = {
  run: challengeSeventeen,
  describe: 'Attack CBC with padding oracle attack.',
};
