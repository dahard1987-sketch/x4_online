import { normalizeSentenceAnswer } from "./sentenceConstruction";

export function extractUnderlinedPart(sentence: string): string {
  const match = sentence.match(/\{\{ul\}\}(.*?)\{\{\/ul\}\}/);
  return match ? match[1] : "";
}

export function compareUnderlineJudgmentAnswer(
  selectedIsCorrect: boolean,
  correctionInput: string,
  isCorrect: boolean,
  correction?: string,
): boolean {
  if (selectedIsCorrect !== isCorrect) return false;
  if (!isCorrect) {
    if (!correction) return false;
    return (
      normalizeSentenceAnswer(correctionInput) ===
      normalizeSentenceAnswer(correction)
    );
  }
  return true;
}
