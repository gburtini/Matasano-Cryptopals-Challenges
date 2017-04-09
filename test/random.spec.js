const expect = require('chai').expect;

const {
  randomKey,
  randomBytes,
} = require('../lib/aes');

describe('Random Accessory', () => {
  describe('randomKey', () => {
    it('should always return 16 bytes', () => {
      for (let i = 1; i < 1000; i++) {
        expect(randomKey().length).to.be.eq(16);
      }
    });
  });

  describe('randomBytes', () => {
    it('should always the requested number of bytes', () => {
      for (let i = 1; i < 100; i++) {
        expect(randomBytes(i).length).to.be.eq(i);
      }
    });
  });
});

