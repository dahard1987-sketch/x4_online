export function parseGivenWords(input: string): string[] {
  return input
    .split(/[/\n,]/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0);
}

export function parseAcceptableAnswers(input: string): string[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function normalizeApostrophes(text: string): string {
  return text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

export function normalizeSentenceAnswer(sentence: string): string {
  return normalizeApostrophes(sentence)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/[.?!]+$/, "");
}

export function compareSentenceConstructionAnswer(
  studentAnswer: string,
  answer: string,
  acceptableAnswers?: string[],
): boolean {
  const normalizedStudent = normalizeSentenceAnswer(studentAnswer);
  if (normalizedStudent === normalizeSentenceAnswer(answer)) {
    return true;
  }
  if (acceptableAnswers && acceptableAnswers.length > 0) {
    return acceptableAnswers.some(
      (acceptable) => normalizeSentenceAnswer(acceptable) === normalizedStudent,
    );
  }
  return false;
}
