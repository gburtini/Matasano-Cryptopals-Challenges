const aes = require('../../lib/aes');
const xor = require('../../lib/xor');
const { decodeBase64, naiveStringToBytes, naiveBytesToString } = require('../../lib/stream');

const util = require('util');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const INPUTS = `SSBoYXZlIG1ldCB0aGVtIGF0IGNsb3NlIG9mIGRheQ==
Q29taW5nIHdpdGggdml2aWQgZmFjZXM=
RnJvbSBjb3VudGVyIG9yIGRlc2sgYW1vbmcgZ3JleQ==
RWlnaHRlZW50aC1jZW50dXJ5IGhvdXNlcy4=
SSBoYXZlIHBhc3NlZCB3aXRoIGEgbm9kIG9mIHRoZSBoZWFk
T3IgcG9saXRlIG1lYW5pbmdsZXNzIHdvcmRzLA==
T3IgaGF2ZSBsaW5nZXJlZCBhd2hpbGUgYW5kIHNhaWQ=
UG9saXRlIG1lYW5pbmdsZXNzIHdvcmRzLA==
QW5kIHRob3VnaHQgYmVmb3JlIEkgaGFkIGRvbmU=
T2YgYSBtb2NraW5nIHRhbGUgb3IgYSBnaWJl
VG8gcGxlYXNlIGEgY29tcGFuaW9u
QXJvdW5kIHRoZSBmaXJlIGF0IHRoZSBjbHViLA==
QmVpbmcgY2VydGFpbiB0aGF0IHRoZXkgYW5kIEk=
QnV0IGxpdmVkIHdoZXJlIG1vdGxleSBpcyB3b3JuOg==
QWxsIGNoYW5nZWQsIGNoYW5nZWQgdXR0ZXJseTo=
QSB0ZXJyaWJsZSBiZWF1dHkgaXMgYm9ybi4=
VGhhdCB3b21hbidzIGRheXMgd2VyZSBzcGVudA==
SW4gaWdub3JhbnQgZ29vZCB3aWxsLA==
SGVyIG5pZ2h0cyBpbiBhcmd1bWVudA==
VW50aWwgaGVyIHZvaWNlIGdyZXcgc2hyaWxsLg==
V2hhdCB2b2ljZSBtb3JlIHN3ZWV0IHRoYW4gaGVycw==
V2hlbiB5b3VuZyBhbmQgYmVhdXRpZnVsLA==
U2hlIHJvZGUgdG8gaGFycmllcnM/
VGhpcyBtYW4gaGFkIGtlcHQgYSBzY2hvb2w=
QW5kIHJvZGUgb3VyIHdpbmdlZCBob3JzZS4=
VGhpcyBvdGhlciBoaXMgaGVscGVyIGFuZCBmcmllbmQ=
V2FzIGNvbWluZyBpbnRvIGhpcyBmb3JjZTs=
SGUgbWlnaHQgaGF2ZSB3b24gZmFtZSBpbiB0aGUgZW5kLA==
U28gc2Vuc2l0aXZlIGhpcyBuYXR1cmUgc2VlbWVkLA==
U28gZGFyaW5nIGFuZCBzd2VldCBoaXMgdGhvdWdodC4=
VGhpcyBvdGhlciBtYW4gSSBoYWQgZHJlYW1lZA==
QSBkcnVua2VuLCB2YWluLWdsb3Jpb3VzIGxvdXQu
SGUgaGFkIGRvbmUgbW9zdCBiaXR0ZXIgd3Jvbmc=
VG8gc29tZSB3aG8gYXJlIG5lYXIgbXkgaGVhcnQs
WWV0IEkgbnVtYmVyIGhpbSBpbiB0aGUgc29uZzs=
SGUsIHRvbywgaGFzIHJlc2lnbmVkIGhpcyBwYXJ0
SW4gdGhlIGNhc3VhbCBjb21lZHk7
SGUsIHRvbywgaGFzIGJlZW4gY2hhbmdlZCBpbiBoaXMgdHVybiw=
VHJhbnNmb3JtZWQgdXR0ZXJseTo=
QSB0ZXJyaWJsZSBiZWF1dHkgaXMgYm9ybi4=`
  .split('\n')
  .map(decodeBase64)
  .map((i) => {
    return aes.encrypt.ctr(
      {
        key: 'YELLOW SUBMARINE',
        nonce: '00000000',
      },
      i
    );
  });

function buildAsteriskString(input, guessed) {
  function setCharAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substr(0, index) + chr + str.substr(index + 1);
  }

  let string = '*'.repeat(input.length);
  guessed.forEach((guess, i) => {
    if (guess !== undefined) string = setCharAt(string, i, guess);
  });
  return string;
}

function challengeNineteen() {
  const knowledge = [...Array(INPUTS.length)].map(() => []);
  const currentKeyGuess = [];

  function outputValues() {
    INPUTS.forEach((str, i) => {
      console.log(util.format('%s\t%s', i, buildAsteriskString(str, knowledge[i])));
    });
  }

  function collectNewValue() {
    rl.question(
      "Specify 'string index character' space delimited or 's' to stop, 'k' to output the key so far:\n",
      (answer) => {
        if (answer === 's') {
          console.log('Abandoning ship.');
          return true;
        }
        if (answer === 'k') {
          console.log(currentKeyGuess);
          return collectNewValue();
        }

        // guess a character in one of the inputs
        if (answer.split(' ').length !== 3) return collectNewValue();
        const [string, index, character] = answer.split(' ');

        // compute xor(input, that_string) to get the effective key for that character
        const key = xor.many(
          naiveStringToBytes(INPUTS[string]),
          naiveStringToBytes(character.repeat(INPUTS[string].length))
        )[index];
        currentKeyGuess[index] = key;

        // xor that key against all the other plaintexts to see if they're sensical.
        INPUTS.forEach((str, i) => {
          knowledge[i][index] = naiveBytesToString(
            xor.many(naiveStringToBytes(str), Array(str.length).fill(key))
          )[index];
        });
        knowledge[string][index] = character;

        outputValues();
        return collectNewValue();
      }
    );
  }

  // This was instructed to be a manual process, so here's proof that it works: https://cl.ly/0r0A3c3f0D1w
  outputValues();
  collectNewValue();
}

module.exports = {
  run: challengeNineteen,
  describe: 'Break fixed-nonce CTR mode using substitutions.',
};
