const terminalPunctuationPattern =
  /^[\s"'"\u2018\u2019\u201c\u201d.,!?;:()[\]{}]+|[\s"'"\u2018\u2019\u201c\u201d.,!?;:()[\]{}]+$/g;

export function normalizeWordArrangementToken(
  token: string,
  options?: { preserveCase?: boolean },
) {
  const normalizedToken = token
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(terminalPunctuationPattern, "")
    .replace(/\s+/g, " ");

  if (options?.preserveCase) {
    return normalizedToken;
  }

  return normalizedToken.toLowerCase();
}

export function tokenizeSentenceForWordArrangement(sentence: string) {
  return sentence
    .split(/\s+/)
    .map((token) =>
      normalizeWordArrangementToken(token, { preserveCase: true }),
    )
    .filter(Boolean);
}

export function buildWordArrangementTokens(
  answerSentence: string,
  properNounIndices: number[],
) {
  const rawTokens = tokenizeSentenceForWordArrangement(answerSentence);
  const properNounIndexSet = new Set(properNounIndices);
  const words = rawTokens.map((token, index) =>
    normalizeWordArrangementToken(token, {
      preserveCase: properNounIndexSet.has(index),
    }),
  );

  return {
    rawTokens,
    words,
    answer: words,
    properNounIndices: properNounIndices.filter(
      (index) => index >= 0 && index < rawTokens.length,
    ),
  };
}

export function compareWordArrangementAnswer(
  selectedTokens: string[],
  answerTokens: string[],
  acceptableAnswers?: string[][],
) {
  const normalizeTokens = (tokens: string[]) =>
    tokens.map((token) => normalizeWordArrangementToken(token)).join(" ");
  const selectedAnswer = normalizeTokens(selectedTokens);
  const primaryAnswer = normalizeTokens(answerTokens);

  if (selectedAnswer === primaryAnswer) {
    return true;
  }

  return (
    acceptableAnswers?.some(
      (acceptableAnswer) => selectedAnswer === normalizeTokens(acceptableAnswer),
    ) ?? false
  );
}
