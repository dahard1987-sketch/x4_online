export type AttemptRoundMode = "full" | "review";

export type AttemptDetail = {
  questionId: string;
  attemptsInActivity: number;
  firstAnsweredCorrect: boolean;
  finalAnsweredCorrect: boolean;
  firstWrongFullRound?: number;
  masteredAtFullRound?: number;
};

export type AttemptRoundSummary = {
  mode: AttemptRoundMode;
  roundNumber: number;
  questionCount: number;
  correctCount: number;
  score: number | null;
};

export type Attempt = {
  id?: string;
  studentId: string;
  studentEmail?: string | null;
  activityId: string;
  activityTitle: string;
  attemptNumber: number;
  score: number;
  finalScore: number;
  firstRoundScore: number;
  bestScore: number;
  totalFullRounds: number;
  totalReviewRounds: number;
  totalAnsweredCount: number;
  durationSec: number;
  completed: boolean;
  startedAt: unknown;
  finishedAt: unknown;
  createdAt?: unknown;
  details: AttemptDetail[];
  roundSummaries: AttemptRoundSummary[];
};
