import { normalizeSentenceAnswer } from "./sentenceConstruction";

export function compareWordFormAnswer(
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
