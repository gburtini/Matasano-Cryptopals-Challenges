function commonLetterScore(input) {
  // const common = ['e', 'i', 'a', 'o', 'r', 's', ' '];
  const common = 'ETAOIN SHRDLU'.toLowerCase().split('');
  let score = 0;
  for (let i = 0; i < input.length; i++) {
    if (common.indexOf(input[i].toLowerCase()) !== -1) {
      score += 1;
    }
  }
  return score;
}

function hammingDistance(a, b) {
  if (a.length > b.length) {
    return hammingDistance(b, a);
  }

  let score = 0;
  for (let i = 0; i < b.length; i++) {
    const binaryA = parseInt(a[i], 10).toString(2);
    const binaryB = parseInt(b[i], 10).toString(2);

    for (let j = 0; j < binaryA.length; j++) {
      if (!binaryB[j] || binaryA[j] !== binaryB[j]) {
        score += 1;
      }
    }
  }

  return score;
}

module.exports = {
  commonLetters: commonLetterScore,
  hamming: hammingDistance,
};
