const expect = require('chai').expect;

const {
  pkcs7Pad: pad,
  stripPkcs7Pad: strip,
} = require('../lib/aes');

describe('PKCS7', () => {
  describe('pad', () => {
    it('should correctly pad all short lengths to 16 bytes', () => {
      for (let i = 1; i < 15; i++) {
        const expectedPadding = String.fromCharCode(16 - i).repeat(16 - i);
        expect(pad('a'.repeat(i), 16)).to.be.eq('a'.repeat(i) + expectedPadding);
      }
    });

    it('should correctly pad zero length to 16 bytes', () => {
      const expectedPadding = String.fromCharCode(16).repeat(16);
      expect(pad('', 16)).to.be.eq(expectedPadding);
    });

    it('should correctly pad a longer string to a multiple of 16', () => {
      const expectedPadding = String.fromCharCode(1).repeat(1);
      const input = 'b'.repeat(31);
      expect(pad(input, 16)).to.be.eq(input + expectedPadding);
    });

    it('should support different target sizes', () => {
      const expectedPadding = String.fromCharCode(2).repeat(2);
      const input = 'c'.repeat(8);
      expect(pad(input, 10)).to.be.eq(input + expectedPadding);
    });

    it('should correctly pad 16 bytes to be 32 bytes', () => {
      // NOTE: this is unexpected at first, but if you padded 16 bytes
      // by adding nothing, you wouldn't be able to strip.

      const expectedPadding = String.fromCharCode(2).repeat(2);
      const input = 'c'.repeat(8);
      expect(pad(input, 10)).to.be.eq(input + expectedPadding);
    });
  });

  describe('strip', () => {
    it('should correctly strip a manually created message with one byte of padding', () => {
      const message = 'abc\x01';
      expect(strip(message)).to.be.eq('abc');
    });

    it('should correctly strip a manually created message with more than one byte of padding', () => {
      const message = 'abc' + String.fromCharCode(4).repeat(4);
      expect(strip(message)).to.be.eq('abc');
    });

    it('should refuse to strip an incorrectly padded message', () => {
      // NOTE: the opposite currently fails, but I think it is impossible to test
      // e.g., a 4 byte padding of \x02 is indistinguishable from a true 2 byte padding
      // on a message that ended in two \x02s.

      const message = 'abc' + String.fromCharCode(4).repeat(2);
      expect(() => strip(message)).to.throw(Error);
    });

    it('should refuse to strip an unpadded message', () => {
      const message = 'abc';
      expect(() => strip(message)).to.throw(Error);
    });
  });
});

