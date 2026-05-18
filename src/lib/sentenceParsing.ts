export type SentenceParsingRole =
  | "subject"
  | "verb"
  | "object"
  | "complement"
  | "modifier"
  | "prepositional";

export type SentenceParsingTarget = {
  role: SentenceParsingRole;
  tokenIndices: number[];
};

export function tokenizeSentenceForParsing(sentence: string): string[] {
  const parts = sentence.trim().split(/\s+/);
  return parts
    .map((token, index) => {
      if (index === parts.length - 1) {
        return token.replace(/[.!?]+$/, "");
      }
      return token;
    })
    .filter(Boolean);
}

export function normalizeTokenIndices(indices: number[]): number[] {
  return [...new Set(indices)].sort((a, b) => a - b);
}

export function compareSentenceParsingTargets(
  studentTargets: SentenceParsingTarget[],
  answerTargets: SentenceParsingTarget[],
): boolean {
  if (studentTargets.length !== answerTargets.length) return false;

  const normalizeTarget = (t: SentenceParsingTarget) => ({
    role: t.role,
    tokenIndices: normalizeTokenIndices(t.tokenIndices),
  });

  const normalizedStudent = studentTargets.map(normalizeTarget);
  const normalizedAnswer = answerTargets.map(normalizeTarget);

  return normalizedAnswer.every((answerTarget) =>
    normalizedStudent.some(
      (studentTarget) =>
        studentTarget.role === answerTarget.role &&
        studentTarget.tokenIndices.length ===
          answerTarget.tokenIndices.length &&
        studentTarget.tokenIndices.every(
          (idx, i) => idx === answerTarget.tokenIndices[i],
        ),
    ),
  );
}

export function formatTargetPreview(
  target: SentenceParsingTarget,
  tokens: string[],
): string {
  const tokenTexts = target.tokenIndices
    .map((i) => tokens[i] ?? `[${i}]`)
    .join(" ");
  return `${getRoleLabel(target.role)}: "${tokenTexts}"`;
}

export function getRoleLabel(role: SentenceParsingRole | string): string {
  switch (role) {
    case "subject":
      return "주어";
    case "verb":
      return "동사";
    case "object":
      return "목적어";
    case "complement":
      return "보어";
    case "modifier":
      return "수식어";
    case "prepositional":
      return "전치사구";
    default:
      return role;
  }
}
