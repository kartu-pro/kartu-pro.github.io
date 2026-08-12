export const EN_TO_KA = Object.freeze({
  'a': 'ა', 'A': 'ა',
  'b': 'ბ', 'B': 'ბ',
  'c': 'ც', 'C': 'ჩ',
  'd': 'დ', 'D': 'ძ',
  'e': 'ე', 'E': 'ე',
  'f': 'ფ', 'F': 'ფ',
  'g': 'გ', 'G': 'გ',
  'h': 'ჰ', 'H': 'ჰ',
  'i': 'ი', 'I': 'ი',
  'j': 'ჯ', 'J': 'ჯ',
  'k': 'კ', 'K': 'კ',
  'l': 'ლ', 'L': 'ლ',
  'm': 'მ', 'M': 'მ',
  'n': 'ნ', 'N': 'ნ',
  'o': 'ო', 'O': 'ო',
  'p': 'პ', 'P': 'პ',
  'q': 'ქ', 'Q': 'ქ',
  'r': 'რ', 'R': 'ღ',
  's': 'ს', 'S': 'შ',
  't': 'ტ', 'T': 'თ',
  'u': 'უ', 'U': 'უ',
  'v': 'ვ', 'V': 'ვ',
  'w': 'წ', 'W': 'ჭ',
  'x': 'ხ', 'X': 'ხ',
  'y': 'ყ', 'Y': 'ყ',
  'z': 'ზ', 'Z': 'ჟ'
});

export const KA_TO_EN = Object.freeze({
  'ა': 'a', 'ბ': 'b', 'ც': 'c', 'ჩ': 'c', 'დ': 'd', 'ძ': 'd',
  'ე': 'e', 'ფ': 'f', 'გ': 'g', 'ჰ': 'h', 'ი': 'i', 'ჯ': 'j',
  'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p',
  'ქ': 'q', 'რ': 'r', 'ღ': 'r', 'ს': 's', 'შ': 's', 'ტ': 't',
  'თ': 't', 'უ': 'u', 'ვ': 'v', 'წ': 'w', 'ჭ': 'w', 'ხ': 'x',
  'ყ': 'y', 'ზ': 'z', 'ჟ': 'z'
});

export function transliterate(text, toGeorgian = true) {
  const map = toGeorgian ? EN_TO_KA : KA_TO_EN;
  return Array.from(text).map(char => map[char] || char).join('');
}

export function computeDiff(input, expected) {
  const n = input.length;
  const m = expected.length;
  const dp = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (input[i - 1] === expected[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  let i = n, j = m;
  const result = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && input[i - 1] === expected[j - 1]) {
      result.unshift({ char: input[i - 1], type: 'match' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ char: expected[j - 1], type: 'insertion' });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ char: input[i - 1], type: 'deletion' });
      i--;
    }
  }
  return result;
}

export function splitSentence(sentence = '', target = '') {
  if (!sentence || !target) return { prefix: sentence, suffix: '', found: false };
  const idx = sentence.indexOf(target);
  if (idx === -1) return { prefix: sentence, suffix: '', found: false };

  return {
    prefix: sentence.slice(0, idx),
    suffix: sentence.slice(idx + target.length),
    found: true
  };
}
