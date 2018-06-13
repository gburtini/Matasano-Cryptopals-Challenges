# JavaScript Solutions for the [Matasano Cryptopals Challenges](https://cryptopals.com/)

## Usage

* `npm start` will run all completed challenges. This uses `./run` in the current directory.
* `./run -s N` will run challenge `N`. e.g., `./run -s 12` runs "12. Byte-at-a-time ECB decryption (Simple)".
* `npm test` will run unit tests on the `lib/` functions.

## Challenges

Set 1: Basics

* [Convert hex to base64](sets/1/01.js)
* [Fixed XOR](sets/1/02.js)
* [Single-byte XOR cipher](sets/1/03.js)
* [Detect single-character XOR](sets/1/04.js)
* [Implement repeating-key XOR](sets/1/05.js)
* [Break repeating-key XOR](sets/1/06.js)
* [AES in ECB mode](sets/1/07.js)
* [Detect AES in ECB mode](sets/1/08.js)

Set 2: Block crypto

* [Implement PKCS#7 padding](sets/2/09.js)
* [Implement CBC mode](sets/2/10.js)
* [An ECB/CBC detection oracle](sets/2/11.js)
* [Byte-at-a-time ECB decryption (Simple)](sets/2/12.js)
* [ECB cut-and-paste](sets/2/13.js)
* [Byte-at-a-time ECB decryption (Harder)](sets/2/14.js)
* [PKCS#7 padding validation](sets/2/15.js)
* [CBC bitflipping attacks](sets/2/16.js)

Set 3: Block & stream crypto

* [The CBC padding oracle](sets/3/17.js)
* [Implement CTR, the stream cipher mode](sets/3/18.js)
* [Break fixed-nonce CTR mode using substitions](sets/3/19.js)
* [Break fixed-nonce CTR statistically](sets/3/20.js)
* [Implement the MT19937 Mersenne Twister RNG](sets/3/21.js)
* [Crack an MT19937 seed](sets/3/22.js)
* [Clone an MT19937 RNG from its output](sets/3/23.js)
* [Create the MT19937 stream cipher and break it](sets/3/24.js)

Set 4: Stream crypto and randomness

* [Break "random access read/write" AES CTR](sets/4/25.js)
* [CTR bitflipping](sets/4/26.js)
* [Recover the key from CBC with IV=Key](sets/4/27.js)
* [Implement a SHA-1 keyed MAC](sets/4/28.js)
* [Break a SHA-1 keyed MAC using length extension](sets/4/29.js)
* Break an MD4 keyed MAC using length extension
* [Implement and break HMAC-SHA1 with an artificial timing leak](sets/4/31.js)
* [Break HMAC-SHA1 with a slightly less artificial timing leak](sets/4/32.js)

Set 5: Diffie-Hellman and friends

* Implement Diffie-Hellman
* Implement a MITM key-fixing attack on Diffie-Hellman with parameter injection
* Implement DH with negotiated groups, and break with malicious "g" parameters
* Implement Secure Remote Password (SRP)
* Break SRP with a zero key
* Offline dictionary attack on simplified SRP
* Implement RSA
* Implement an E=3 RSA Broadcast attack

Set 6: RSA and DSA

* Implement unpadded message recovery oracle
* Bleichenbacher's e=3 RSA Attack
* DSA key recovery from nonce
* DSA nonce recovery from repeated nonce
* DSA parameter tampering
* RSA parity oracle
* Bleichenbacher's PKCS 1.5 Padding Oracle (Simple Case)
* Bleichenbacher's PKCS 1.5 Padding Oracle (Complete Case)

Set 7: Hashes

* CBC-MAC Message Forgery
* Hashing with CBC-MAC
* Compression Ratio Side-Channel Attacks
* Iterated Hash Function Multicollisions
* Kelsey and Schneier's Expandable Messages
* Kelsey and Kohno's Nostradamus Attack
* MD4 Collisions
* RC4 Single-Byte Biases

Set 8: Abstract Algebra

* Diffie-Hellman Revisited: Small Subgroup Confinement
* Pollard's Method for Catching Kangaroos
* Elliptic Curve Diffie-Hellman and Invalid-Curve Attacks
* Single-Coordinate Ladders and Insecure Twists
* Duplicate-Signature Key Selection in ECDSA (and RSA)
* Key-Recovery Attacks on ECDSA with Biased Nonces
* Key-Recovery Attacks on GCM with Repeated Nonces
* Key-Recovery Attacks on GCM with a Truncated MAC
