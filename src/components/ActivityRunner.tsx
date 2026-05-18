"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AttemptDetail,
  AttemptRoundSummary,
} from "@/types/attempt";
import { compareWordArrangementAnswer } from "@/lib/wordArrangement";
import { compareSentenceConstructionAnswer } from "@/lib/sentenceConstruction";
import { compareWordFormAnswer } from "@/lib/wordForm";
import { compareUnderlineJudgmentAnswer } from "@/lib/underlineJudgment";
import {
  compareSentenceParsingTargets,
  formatTargetPreview,
  getRoleLabel,
} from "@/lib/sentenceParsing";
import type { SentenceParsingTarget } from "@/lib/sentenceParsing";

export type ActivityRunnerQuestion = {
  id: string;
  type: string;
  prompt: string;
  // multiple_choice / binary_choice
  choices?: string[];
  answer?: number;
  // word_arrangement
  hint?: string;
  words?: string[];
  wordAnswer?: string[];
  acceptableAnswers?: string[][];
  properNounIndices?: number[];
  // sentence_construction
  koreanHint?: string;
  givenWords?: string[];
  sentenceAnswer?: string;
  scAcceptableAnswers?: string[];
  // word_form
  wordFormSentence?: string;
  wordFormBaseWord?: string;
  wordFormHint?: string;
  wordFormAnswer?: string;
  wordFormAcceptableAnswers?: string[];
  // underline_judgment
  underlineSentence?: string;
  underlineIsCorrect?: boolean;
  underlineCorrection?: string;
  // sentence_parsing
  spSentence?: string;
  spTokens?: string[];
  spTargets?: { role: string; tokenIndices: number[] }[];
  // common
  explanation?: string;
};

type SupportedRunnerQuestion = ActivityRunnerQuestion & {
  type: "multiple_choice" | "binary_choice";
  choices: string[];
  answer: number;
};

type ShuffledChoice = {
  text: string;
  originalIndex: number;
};

type ShuffledWord = {
  text: string;
  originalIndex: number;
};

type WordArrangementRunnerQuestion = ActivityRunnerQuestion & {
  type: "word_arrangement";
  words: string[];
  wordAnswer: string[];
};

type SentenceConstructionRunnerQuestion = ActivityRunnerQuestion & {
  type: "sentence_construction";
  sentenceAnswer: string;
};

type WordFormRunnerQuestion = ActivityRunnerQuestion & {
  type: "word_form";
  wordFormSentence: string;
  wordFormBaseWord: string;
  wordFormAnswer: string;
};

type UnderlineJudgmentRunnerQuestion = ActivityRunnerQuestion & {
  type: "underline_judgment";
  underlineSentence: string;
  underlineIsCorrect: boolean;
};

type SentenceParsingRunnerQuestion = ActivityRunnerQuestion & {
  type: "sentence_parsing";
  spSentence: string;
  spTokens: string[];
  spTargets: { role: string; tokenIndices: number[] }[];
};

function isWordArrangementQuestion(
  question: ActivityRunnerQuestion,
): question is WordArrangementRunnerQuestion {
  return (
    question.type === "word_arrangement" &&
    Array.isArray(question.words) &&
    Array.isArray(question.wordAnswer)
  );
}

function isSentenceConstructionQuestion(
  question: ActivityRunnerQuestion,
): question is SentenceConstructionRunnerQuestion {
  return (
    question.type === "sentence_construction" &&
    typeof question.sentenceAnswer === "string"
  );
}

function isWordFormQuestion(
  question: ActivityRunnerQuestion,
): question is WordFormRunnerQuestion {
  return (
    question.type === "word_form" &&
    typeof question.wordFormSentence === "string" &&
    typeof question.wordFormBaseWord === "string" &&
    typeof question.wordFormAnswer === "string"
  );
}

function isUnderlineJudgmentQuestion(
  question: ActivityRunnerQuestion,
): question is UnderlineJudgmentRunnerQuestion {
  return (
    question.type === "underline_judgment" &&
    typeof question.underlineSentence === "string" &&
    typeof question.underlineIsCorrect === "boolean"
  );
}

function isSentenceParsingQuestion(
  question: ActivityRunnerQuestion,
): question is SentenceParsingRunnerQuestion {
  return (
    question.type === "sentence_parsing" &&
    typeof question.spSentence === "string" &&
    Array.isArray(question.spTokens) &&
    Array.isArray(question.spTargets)
  );
}

type RoundMode = "full" | "review";

type RoundQuestionState = {
  roundQuestions: ActivityRunnerQuestion[];
  shuffledChoices: ShuffledChoice[];
  shuffledWords: ShuffledWord[];
};

type QuestionProgress = {
  questionId: string;
  attemptsInActivity: number;
  firstAnsweredCorrect?: boolean;
  finalAnsweredCorrect: boolean;
  firstWrongFullRound?: number;
  masteredAtFullRound?: number;
};

export type ActivityRunnerResult = {
  activityTitle: string;
  score: number;
  finalScore: number;
  firstRoundScore: number;
  bestScore: number;
  totalFullRounds: number;
  totalReviewRounds: number;
  totalAnsweredCount: number;
  durationSec: number;
  completed: boolean;
  startedAt: Date;
  finishedAt: Date;
  details: AttemptDetail[];
  roundSummaries: AttemptRoundSummary[];
};

function isSupportedQuestion(
  question: ActivityRunnerQuestion,
): question is SupportedRunnerQuestion {
  if (question.type !== "multiple_choice" && question.type !== "binary_choice") {
    return false;
  }

  if (!Array.isArray(question.choices) || typeof question.answer !== "number") {
    return false;
  }

  if (question.type === "binary_choice" && question.choices.length !== 2) {
    return false;
  }

  return question.answer >= 0 && question.answer < question.choices.length;
}

function shuffleArray<T>(items: T[]) {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const currentItem = shuffledItems[index];

    shuffledItems[index] = shuffledItems[randomIndex];
    shuffledItems[randomIndex] = currentItem;
  }

  return shuffledItems;
}

function buildShuffledWords(
  question: ActivityRunnerQuestion | undefined,
): ShuffledWord[] {
  if (
    !question ||
    question.type !== "word_arrangement" ||
    !Array.isArray(question.words)
  ) {
    return [];
  }

  return shuffleArray(
    question.words.map((text, originalIndex) => ({ text, originalIndex })),
  );
}

function buildShuffledChoices(
  question: ActivityRunnerQuestion | undefined,
): ShuffledChoice[] {
  if (!question) {
    return [];
  }

  if (!isSupportedQuestion(question)) {
    return [];
  }

  return shuffleArray(
    question.choices.map((text, originalIndex) => ({
      text,
      originalIndex,
    })),
  );
}

function buildRoundQuestionState(
  roundQuestions: ActivityRunnerQuestion[],
): RoundQuestionState {
  return {
    roundQuestions,
    shuffledChoices: buildShuffledChoices(roundQuestions[0]),
    shuffledWords: buildShuffledWords(roundQuestions[0]),
  };
}

function startFullRound(
  questions: ActivityRunnerQuestion[],
): RoundQuestionState {
  return buildRoundQuestionState(shuffleArray(questions));
}

function startReviewRound(
  wrongQuestions: ActivityRunnerQuestion[],
): RoundQuestionState {
  return buildRoundQuestionState(shuffleArray(wrongQuestions));
}

function calculateScore(correctCount: number, totalCount: number) {
  return Math.round((correctCount / totalCount) * 100);
}

function buildAttemptDetails(
  progressByQuestionId: Record<string, QuestionProgress>,
): AttemptDetail[] {
  return Object.values(progressByQuestionId).map((progress) => ({
    questionId: progress.questionId,
    attemptsInActivity: progress.attemptsInActivity,
    firstAnsweredCorrect: Boolean(progress.firstAnsweredCorrect),
    finalAnsweredCorrect: progress.finalAnsweredCorrect,
    ...(progress.firstWrongFullRound
      ? { firstWrongFullRound: progress.firstWrongFullRound }
      : {}),
    ...(progress.masteredAtFullRound
      ? { masteredAtFullRound: progress.masteredAtFullRound }
      : {}),
  }));
}

export default function ActivityRunner({
  activityTitle,
  questions,
  saveStatus,
  savedAttemptId,
  saveErrorMessage,
  onComplete,
}: {
  activityTitle: string;
  questions: ActivityRunnerQuestion[];
  saveStatus?: "idle" | "saving" | "saved" | "error";
  savedAttemptId?: string;
  saveErrorMessage?: string;
  onComplete?: (result: ActivityRunnerResult) => void;
}) {
  const startedAtRef = useRef(new Date());
  const completionNotifiedRef = useRef(false);
  const [roundMode, setRoundMode] = useState<RoundMode>("full");
  const [fullRoundNumber, setFullRoundNumber] = useState(1);
  const [reviewRoundNumber, setReviewRoundNumber] = useState(0);
  const [roundState, setRoundState] = useState<RoundQuestionState>(() =>
    startFullRound(questions),
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [sentenceInput, setSentenceInput] = useState("");
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
    correctAnswer?: string;
  } | null>(null);
  const [roundCorrectCount, setRoundCorrectCount] = useState(0);
  const [roundWrongQuestions, setRoundWrongQuestions] = useState<
    ActivityRunnerQuestion[]
  >([]);
  const [fullRoundScores, setFullRoundScores] = useState<number[]>([]);
  const [roundSummaries, setRoundSummaries] = useState<AttemptRoundSummary[]>(
    [],
  );
  const [questionProgress, setQuestionProgress] = useState<
    Record<string, QuestionProgress>
  >({});
  const [totalAnsweredCount, setTotalAnsweredCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedWordTokens, setSelectedWordTokens] = useState<ShuffledWord[]>(
    [],
  );
  const [wordFormInput, setWordFormInput] = useState("");
  const [underlineSelected, setUnderlineSelected] = useState<boolean | null>(
    null,
  );
  const [underlineCorrectionInput, setUnderlineCorrectionInput] =
    useState("");
  const [spTokenRoles, setSpTokenRoles] = useState<Record<number, string>>({});
  const [spActiveRole, setSpActiveRole] = useState<string | null>(null);

  const { roundQuestions, shuffledChoices, shuffledWords } = roundState;
  const currentQuestion = roundQuestions[questionIndex];
  const supportedCurrentQuestion =
    currentQuestion && isSupportedQuestion(currentQuestion)
      ? currentQuestion
      : null;
  const wordArrangementCurrentQuestion =
    currentQuestion && isWordArrangementQuestion(currentQuestion)
      ? currentQuestion
      : null;
  const sentenceConstructionCurrentQuestion =
    currentQuestion && isSentenceConstructionQuestion(currentQuestion)
      ? currentQuestion
      : null;
  const wordFormCurrentQuestion =
    currentQuestion && isWordFormQuestion(currentQuestion)
      ? currentQuestion
      : null;
  const underlineCurrentQuestion =
    currentQuestion && isUnderlineJudgmentQuestion(currentQuestion)
      ? currentQuestion
      : null;
  const sentenceParsingCurrentQuestion =
    currentQuestion && isSentenceParsingQuestion(currentQuestion)
      ? currentQuestion
      : null;
  const progressPercent =
    roundQuestions.length > 0
      ? ((questionIndex + 1) / roundQuestions.length) * 100
      : 0;
  const isLastQuestion = questionIndex === roundQuestions.length - 1;

  const result = useMemo(() => {
    const bestScore =
      fullRoundScores.length > 0 ? Math.max(...fullRoundScores) : 0;

    return {
      firstRoundScore: fullRoundScores[0] ?? 0,
      bestScore,
      finalScore: 100,
      totalFullRounds: fullRoundScores.length,
      totalReviewRounds: reviewRoundNumber,
      totalAnsweredCount,
    };
  }, [fullRoundScores, reviewRoundNumber, totalAnsweredCount]);

  const roundLabel =
    roundMode === "review"
      ? `오답 복습 ${reviewRoundNumber}`
      : fullRoundNumber === 1
        ? "전체 풀이 1"
        : `전체 재도전 ${fullRoundNumber}`;

  function handleSubmit() {
    if (feedback || !currentQuestion) {
      return;
    }

    let isCorrect: boolean;
    let correctAnswer: string | undefined;

    if (isSentenceConstructionQuestion(currentQuestion)) {
      if (sentenceInput.trim() === "") {
        return;
      }
      isCorrect = compareSentenceConstructionAnswer(
        sentenceInput,
        currentQuestion.sentenceAnswer,
        currentQuestion.scAcceptableAnswers,
      );
      if (!isCorrect) {
        correctAnswer = currentQuestion.sentenceAnswer;
      }
    } else if (isWordArrangementQuestion(currentQuestion)) {
      if (selectedWordTokens.length === 0) {
        return;
      }
      isCorrect = compareWordArrangementAnswer(
        selectedWordTokens.map((token) => token.text),
        currentQuestion.wordAnswer,
        currentQuestion.acceptableAnswers,
      );
    } else if (isWordFormQuestion(currentQuestion)) {
      if (wordFormInput.trim() === "") {
        return;
      }
      isCorrect = compareWordFormAnswer(
        wordFormInput,
        currentQuestion.wordFormAnswer,
        currentQuestion.wordFormAcceptableAnswers,
      );
      if (!isCorrect) {
        correctAnswer = currentQuestion.wordFormAnswer;
      }
    } else if (isUnderlineJudgmentQuestion(currentQuestion)) {
      if (underlineSelected === null) {
        return;
      }
      if (!underlineSelected && underlineCorrectionInput.trim() === "") {
        return;
      }
      isCorrect = compareUnderlineJudgmentAnswer(
        underlineSelected,
        underlineCorrectionInput,
        currentQuestion.underlineIsCorrect,
        currentQuestion.underlineCorrection,
      );
      if (!isCorrect) {
        correctAnswer = currentQuestion.underlineIsCorrect
          ? "O (어법상 올바름)"
          : `X → ${currentQuestion.underlineCorrection ?? "?"}`;
      }
    } else if (isSentenceParsingQuestion(currentQuestion)) {
      const hasAnyRole = Object.keys(spTokenRoles).length > 0;
      if (!hasAnyRole) {
        return;
      }
      const roleMap = new Map<string, number[]>();
      Object.entries(spTokenRoles).forEach(([indexStr, role]) => {
        const idx = parseInt(indexStr, 10);
        if (!roleMap.has(role)) roleMap.set(role, []);
        roleMap.get(role)!.push(idx);
      });
      const studentTargets: SentenceParsingTarget[] = Array.from(
        roleMap.entries(),
      ).map(([role, indices]) => ({
        role: role as SentenceParsingTarget["role"],
        tokenIndices: [...indices].sort((a, b) => a - b),
      }));
      isCorrect = compareSentenceParsingTargets(
        studentTargets,
        currentQuestion.spTargets as SentenceParsingTarget[],
      );
      if (!isCorrect) {
        correctAnswer = (currentQuestion.spTargets as SentenceParsingTarget[])
          .map((t) => formatTargetPreview(t, currentQuestion.spTokens))
          .join(", ");
      }
    } else if (isSupportedQuestion(currentQuestion)) {
      if (selectedAnswer === null) {
        return;
      }
      isCorrect = selectedAnswer === currentQuestion.answer;
    } else {
      return;
    }

    setTotalAnsweredCount((count) => count + 1);
    setQuestionProgress((progressByQuestionId) => {
      const previousProgress = progressByQuestionId[currentQuestion.id];
      const attemptsInActivity =
        (previousProgress?.attemptsInActivity ?? 0) + 1;

      return {
        ...progressByQuestionId,
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          attemptsInActivity,
          firstAnsweredCorrect:
            previousProgress?.firstAnsweredCorrect ?? isCorrect,
          finalAnsweredCorrect: isCorrect,
          firstWrongFullRound:
            previousProgress?.firstWrongFullRound ??
            (roundMode === "full" && !isCorrect ? fullRoundNumber : undefined),
          masteredAtFullRound:
            previousProgress?.masteredAtFullRound ??
            (roundMode === "full" && isCorrect ? fullRoundNumber : undefined),
        },
      };
    });
    setFeedback({
      isCorrect,
      explanation: currentQuestion.explanation || "해설이 아직 없습니다.",
      ...(correctAnswer ? { correctAnswer } : {}),
    });

    if (isCorrect) {
      setRoundCorrectCount((count) => count + 1);
    }

    if (roundMode === "review") {
      return;
    }

    if (!isCorrect) {
      setRoundWrongQuestions((questionsInRound) => [
        ...questionsInRound,
        currentQuestion,
      ]);
    }
  }

  function moveToNextQuestion() {
    const isLastQuestion = questionIndex === roundQuestions.length - 1;

    if (!isLastQuestion) {
      const nextIndex = questionIndex + 1;

      setQuestionIndex(nextIndex);
      setRoundState((currentRoundState) => ({
        ...currentRoundState,
        shuffledChoices: buildShuffledChoices(
          currentRoundState.roundQuestions[nextIndex],
        ),
        shuffledWords: buildShuffledWords(
          currentRoundState.roundQuestions[nextIndex],
        ),
      }));
      setSelectedAnswer(null);
      setSelectedWordTokens([]);
      setSentenceInput("");
      setWordFormInput("");
      setUnderlineSelected(null);
      setUnderlineCorrectionInput("");
      setSpTokenRoles({});
      setSpActiveRole(null);
      setFeedback(null);
      return;
    }

    if (roundMode === "review") {
      const reviewSummary: AttemptRoundSummary = {
        mode: "review",
        roundNumber: reviewRoundNumber,
        questionCount: roundQuestions.length,
        correctCount: roundCorrectCount,
        score: null,
      };

      setRoundSummaries((summaries) => [...summaries, reviewSummary]);
      setRoundMode("full");
      setFullRoundNumber((number) => number + 1);
      setRoundState(startFullRound(questions));
      setQuestionIndex(0);
      setSelectedAnswer(null);
      setSelectedWordTokens([]);
      setSentenceInput("");
      setWordFormInput("");
      setUnderlineSelected(null);
      setUnderlineCorrectionInput("");
      setSpTokenRoles({});
      setSpActiveRole(null);
      setFeedback(null);
      setRoundCorrectCount(0);
      setRoundWrongQuestions([]);
      return;
    }

    const score = calculateScore(roundCorrectCount, roundQuestions.length);
    const nextScores = [...fullRoundScores, score];
    const fullRoundSummary: AttemptRoundSummary = {
      mode: "full",
      roundNumber: fullRoundNumber,
      questionCount: roundQuestions.length,
      correctCount: roundCorrectCount,
      score,
    };
    const nextRoundSummaries = [...roundSummaries, fullRoundSummary];

    setFullRoundScores(nextScores);
    setRoundSummaries(nextRoundSummaries);

    if (score === 100) {
      setIsComplete(true);
      if (!completionNotifiedRef.current) {
        const finishedAt = new Date();
        completionNotifiedRef.current = true;
        onComplete?.({
          activityTitle,
          score,
          finalScore: score,
          firstRoundScore: nextScores[0] ?? score,
          bestScore: Math.max(...nextScores),
          totalFullRounds: nextScores.length,
          totalReviewRounds: reviewRoundNumber,
          totalAnsweredCount,
          durationSec: Math.max(
            0,
            Math.round(
              (finishedAt.getTime() - startedAtRef.current.getTime()) / 1000,
            ),
          ),
          completed: true,
          startedAt: startedAtRef.current,
          finishedAt,
          details: buildAttemptDetails(questionProgress),
          roundSummaries: nextRoundSummaries,
        });
      }
      return;
    }

    setRoundMode("review");
    setReviewRoundNumber((number) => number + 1);
    setRoundState(startReviewRound(roundWrongQuestions));
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setSelectedWordTokens([]);
    setSentenceInput("");
    setWordFormInput("");
    setUnderlineSelected(null);
    setUnderlineCorrectionInput("");
    setSpTokenRoles({});
    setFeedback(null);
    setRoundCorrectCount(0);
    setRoundWrongQuestions([]);
  }

  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;
  const moveToNextQuestionRef = useRef(moveToNextQuestion);
  moveToNextQuestionRef.current = moveToNextQuestion;
  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;
  const isCompleteRef = useRef(isComplete);
  isCompleteRef.current = isComplete;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter") return;
      if (isCompleteRef.current) return;
      const el = event.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
      if (feedbackRef.current) {
        moveToNextQuestionRef.current();
      } else {
        handleSubmitRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-canvas-light px-5 py-10 text-body-on-light">
        <section className="mx-auto max-w-learning rounded-xl border border-hairline-on-light bg-canvas-light p-6 sm:p-8">
          <p className="text-sm font-semibold text-incorrect">
            풀이할 문항이 없습니다.
          </p>
          <Link className="button-primary mt-6" href="/dashboard">
            대시보드로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  if (isComplete) {
    return (
      <main className="min-h-screen bg-canvas-light px-5 py-10 text-body-on-light">
        <section className="mx-auto max-w-learning">
          <div className="overflow-hidden rounded-xl border border-hairline-on-light">
            <div className="bg-primary px-6 py-10 text-center text-on-primary sm:px-8 sm:py-14">
              <p className="text-sm font-semibold opacity-75">{activityTitle}</p>
              <p className="mt-5 text-[80px] font-bold leading-none tabular-nums">
                100
              </p>
              <p className="text-2xl font-bold">점</p>
              <p className="mt-4 text-sm opacity-75">
                모든 문항을 완료했습니다!
              </p>
            </div>

            <div className="bg-canvas-light p-6 sm:p-8">
              {saveStatus ? (
                <div className="rounded-lg border border-hairline-on-light bg-surface-soft-light p-4 text-sm">
                  {saveStatus === "saving" ? (
                    <p className="font-semibold text-primary">
                      학습 결과를 저장하고 있습니다.
                    </p>
                  ) : null}
                  {saveStatus === "saved" ? (
                    <p className="font-semibold text-correct">
                      학습 결과가 저장되었습니다.
                    </p>
                  ) : null}
                  {saveStatus === "error" ? (
                    <p className="font-semibold text-incorrect">
                      학습 결과 저장에 실패했습니다.
                    </p>
                  ) : null}
                  {saveErrorMessage ? (
                    <p className="mt-2 text-xs leading-5 text-body-on-light">
                      {saveErrorMessage}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <dl className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-hairline-on-light bg-surface-soft-light p-5">
                  <dt className="text-sm text-muted">첫 전체 풀이 점수</dt>
                  <dd className="mt-3 text-2xl font-semibold tabular-nums text-body-on-light">
                    {result.firstRoundScore}점
                  </dd>
                </div>
                <div className="rounded-lg border border-hairline-on-light bg-surface-soft-light p-5">
                  <dt className="text-sm text-muted">최고 전체 풀이 점수</dt>
                  <dd className="mt-3 text-2xl font-semibold tabular-nums text-body-on-light">
                    {result.bestScore}점
                  </dd>
                </div>
                <div className="rounded-lg border border-hairline-on-light bg-surface-soft-light p-5">
                  <dt className="text-sm text-muted">전체 풀이 횟수</dt>
                  <dd className="mt-3 text-2xl font-semibold tabular-nums text-body-on-light">
                    {result.totalFullRounds}회
                  </dd>
                </div>
                <div className="rounded-lg border border-hairline-on-light bg-surface-soft-light p-5">
                  <dt className="text-sm text-muted">오답 복습 횟수</dt>
                  <dd className="mt-3 text-2xl font-semibold tabular-nums text-body-on-light">
                    {result.totalReviewRounds}회
                  </dd>
                </div>
                <div className="rounded-lg border border-hairline-on-light bg-surface-soft-light p-5">
                  <dt className="text-sm text-muted">총 풀이 문항 수</dt>
                  <dd className="mt-3 text-2xl font-semibold tabular-nums text-body-on-light">
                    {result.totalAnsweredCount}개
                  </dd>
                </div>
              </dl>

              <Link className="button-primary mt-8" href="/dashboard">
                대시보드로 돌아가기
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas-light px-5 py-8 text-body-on-light sm:py-10">
      <section className="mx-auto max-w-learning">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link className="text-sm font-semibold text-primary" href="/dashboard">
            대시보드
          </Link>
          <p className="text-right text-sm text-muted">{activityTitle}</p>
        </div>

        <div className="rounded-xl border border-hairline-on-light bg-canvas-light p-5 sm:p-8">
          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-muted">
                {roundLabel} · {questionIndex + 1}/{roundQuestions.length}
              </p>
              <p className="text-sm font-semibold text-primary">
                {Math.round(progressPercent)}%
              </p>
            </div>
            <div className="mt-3 h-1 rounded-pill bg-surface-strong-light">
              <div
                className="h-1 rounded-pill bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {roundMode === "review" ? (
              <p className="mt-3 text-xs leading-5 text-muted">
                이 단계는 점수에 반영되지 않습니다. 다시 전체 문제를 풀어
                100점을 받아야 완료됩니다.
              </p>
            ) : null}
          </div>

          <div className="mt-10">
            {sentenceConstructionCurrentQuestion ? (
              <SentenceConstructionPrompt
                question={sentenceConstructionCurrentQuestion}
                sentenceInput={sentenceInput}
                isDisabled={Boolean(feedback)}
                onInputChange={setSentenceInput}
                onSubmit={handleSubmit}
              />
            ) : wordArrangementCurrentQuestion ? (
              <WordArrangementPrompt
                question={wordArrangementCurrentQuestion}
                shuffledWords={shuffledWords}
                selectedWordTokens={selectedWordTokens}
                isDisabled={Boolean(feedback)}
                onSelectWord={(word) =>
                  setSelectedWordTokens((tokens) => [...tokens, word])
                }
                onDeselectWord={(positionIndex) =>
                  setSelectedWordTokens((tokens) =>
                    tokens.filter((_, i) => i !== positionIndex),
                  )
                }
                onClearAll={() => setSelectedWordTokens([])}
              />
            ) : wordFormCurrentQuestion ? (
              <WordFormPrompt
                question={wordFormCurrentQuestion}
                wordFormInput={wordFormInput}
                isDisabled={Boolean(feedback)}
                onInputChange={setWordFormInput}
                onSubmit={handleSubmit}
              />
            ) : underlineCurrentQuestion ? (
              <UnderlineJudgmentPrompt
                question={underlineCurrentQuestion}
                underlineSelected={underlineSelected}
                correctionInput={underlineCorrectionInput}
                isDisabled={Boolean(feedback)}
                onSelect={setUnderlineSelected}
                onCorrectionChange={setUnderlineCorrectionInput}
              />
            ) : sentenceParsingCurrentQuestion ? (
              <SentenceParsingPrompt
                question={sentenceParsingCurrentQuestion}
                tokenRoles={spTokenRoles}
                activeRole={spActiveRole}
                isDisabled={Boolean(feedback)}
                onSelectRole={(role) =>
                  setSpActiveRole((prev) => (prev === role ? null : role))
                }
                onClickToken={(index) => {
                  if (feedback || !spActiveRole) return;
                  setSpTokenRoles((prev) => {
                    const next = { ...prev };
                    if (prev[index] === spActiveRole) {
                      delete next[index];
                    } else {
                      next[index] = spActiveRole;
                    }
                    return next;
                  });
                }}
              />
            ) : !supportedCurrentQuestion ? (
              <UnsupportedQuestionMessage />
            ) : supportedCurrentQuestion.type === "multiple_choice" ? (
              <MultipleChoicePrompt
                question={supportedCurrentQuestion}
                choices={shuffledChoices}
                selectedAnswer={selectedAnswer}
                isDisabled={Boolean(feedback)}
                onSelect={setSelectedAnswer}
              />
            ) : (
              <BinaryChoicePrompt
                prompt={supportedCurrentQuestion.prompt}
                choices={shuffledChoices}
                selectedAnswer={selectedAnswer}
                isDisabled={Boolean(feedback)}
                onSelect={setSelectedAnswer}
              />
            )}
          </div>

          {feedback ? (
            <div
              className={`mt-8 rounded-lg border p-4 ${
                feedback.isCorrect
                  ? "border-correct bg-correct/10"
                  : "border-incorrect bg-incorrect/10"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  feedback.isCorrect ? "text-correct" : "text-incorrect"
                }`}
              >
                {feedback.isCorrect ? "정답입니다." : "오답입니다."}
              </p>
              {feedback.correctAnswer ? (
                <p className="mt-2 text-sm leading-6 text-muted">
                  정답:{" "}
                  <span className="font-semibold text-body-on-light">
                    {feedback.correctAnswer}
                  </span>
                </p>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-body-on-light">
                {feedback.explanation}
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex justify-end">
            {feedback ? (
              <button
                className="button-primary"
                type="button"
                onClick={moveToNextQuestion}
              >
                다음 문제
              </button>
            ) : (
              <button
                className={isLastQuestion ? "button-correct" : "button-primary"}
                type="button"
                onClick={handleSubmit}
                disabled={
                  sentenceConstructionCurrentQuestion
                    ? sentenceInput.trim() === ""
                    : wordArrangementCurrentQuestion
                      ? selectedWordTokens.length === 0
                      : wordFormCurrentQuestion
                        ? wordFormInput.trim() === ""
                        : underlineCurrentQuestion
                          ? underlineSelected === null ||
                            (!underlineSelected &&
                              underlineCorrectionInput.trim() === "")
                          : sentenceParsingCurrentQuestion
                            ? Object.keys(spTokenRoles).length === 0
                            : selectedAnswer === null ||
                              !supportedCurrentQuestion
                }
              >
                {isLastQuestion ? "답안 제출" : "제출"}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function UnsupportedQuestionMessage() {
  return (
    <div className="rounded-lg border border-incorrect bg-incorrect/10 p-5">
      <p className="text-sm font-semibold text-incorrect">
        아직 지원하지 않는 문항 유형입니다.
      </p>
      <p className="mt-2 text-sm leading-6 text-body-on-light">
        현재 객관식, 이항대립, 단어 배열, 문장 완성, 단어 변형, 밑줄 어법 판단,
        문장 성분 분석 문항을 지원합니다.
      </p>
    </div>
  );
}

function WordFormPrompt({
  question,
  wordFormInput,
  isDisabled,
  onInputChange,
  onSubmit,
}: {
  question: WordFormRunnerQuestion;
  wordFormInput: string;
  isDisabled: boolean;
  onInputChange: (value: string) => void;
  onSubmit?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const parts = question.wordFormSentence.split("{{blank}}");
  const beforeBlank = parts[0] ?? "";
  const afterBlank = parts[1] ?? "";

  return (
    <>
      <p className="text-question-body text-body-on-light">{question.prompt}</p>
      {question.wordFormHint ? (
        <p className="mt-2 text-sm leading-6 text-muted">
          {question.wordFormHint}
        </p>
      ) : null}

      <div className="mt-8">
        <p
          className="flex flex-wrap items-center gap-x-3 text-body-on-light"
          style={{ fontSize: "36px", lineHeight: "2.2", fontWeight: 500 }}
        >
          <span>{beforeBlank}</span>
          <input
            ref={inputRef}
            className="inline-block rounded-md border-2 border-primary/60 bg-surface-strong-light px-4 text-body-on-light placeholder:text-muted/50 focus:border-primary focus:outline-none disabled:opacity-60"
            style={{
              fontSize: "36px",
              lineHeight: "1.6",
              minWidth: "160px",
              paddingTop: "4px",
              paddingBottom: "4px",
            }}
            value={wordFormInput}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !isDisabled && wordFormInput.trim()) {
                event.preventDefault();
                onSubmit?.();
              }
            }}
            placeholder={question.wordFormBaseWord}
            disabled={isDisabled}
          />
          <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>
            ({question.wordFormBaseWord})
          </span>
          <span>{afterBlank}</span>
        </p>
      </div>
    </>
  );
}

function UnderlineJudgmentPrompt({
  question,
  underlineSelected,
  correctionInput,
  isDisabled,
  onSelect,
  onCorrectionChange,
}: {
  question: UnderlineJudgmentRunnerQuestion;
  underlineSelected: boolean | null;
  correctionInput: string;
  isDisabled: boolean;
  onSelect: (value: boolean) => void;
  onCorrectionChange: (value: string) => void;
}) {
  const parts = question.underlineSentence.split(/\{\{ul\}\}|\{\{\/ul\}\}/);
  const beforeUnderline = parts[0] ?? "";
  const underlinedText = parts[1] ?? "";
  const afterUnderline = parts[2] ?? "";

  return (
    <>
      <p className="text-question-body text-body-on-light">{question.prompt}</p>

      <div className="mt-6">
        <p className="text-question-body text-body-on-light">
          <span>{beforeUnderline}</span>
          <span className="underline decoration-2">{underlinedText}</span>
          <span>{afterUnderline}</span>
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        {([true, false] as const).map((value) => (
          <button
            key={String(value)}
            className={`min-h-12 min-w-20 rounded-md border px-6 text-lg font-bold transition ${
              underlineSelected === value
                ? "border-primary bg-primary text-on-primary"
                : "border-hairline-on-light bg-canvas-light text-body-on-light hover:bg-surface-soft-light"
            }`}
            type="button"
            onClick={() => onSelect(value)}
            disabled={isDisabled}
          >
            {value ? "O" : "X"}
          </button>
        ))}
      </div>

      {underlineSelected === false ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            올바른 표현
          </p>
          <input
            className="mt-2 w-full rounded-lg border border-hairline-on-light bg-surface-strong-light p-3 text-sm text-body-on-light placeholder:text-muted focus:border-primary focus:outline-none disabled:opacity-60"
            value={correctionInput}
            onChange={(event) => onCorrectionChange(event.target.value)}
            placeholder="올바른 표현을 입력하세요."
            disabled={isDisabled}
          />
        </div>
      ) : null}
    </>
  );
}

function MultipleChoicePrompt({
  question,
  choices,
  selectedAnswer,
  isDisabled,
  onSelect,
}: {
  question: SupportedRunnerQuestion;
  choices: ShuffledChoice[];
  selectedAnswer: number | null;
  isDisabled: boolean;
  onSelect: (originalIndex: number) => void;
}) {
  useEffect(() => {
    if (isDisabled) return;
    function onKeyDown(event: KeyboardEvent) {
      const digit = parseInt(event.key, 10);
      if (isNaN(digit) || digit < 1 || digit > choices.length) return;
      const el = event.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
      const choice = choices[digit - 1];
      if (choice) onSelect(choice.originalIndex);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDisabled, choices, onSelect]);

  return (
    <>
      <p className="text-question-body text-body-on-light">{question.prompt}</p>
      <div className="mt-8 grid gap-3">
        {choices.map((choice, displayIndex) => (
          <button
            className={`min-h-12 rounded-md border px-4 py-3 text-left text-xl font-semibold transition ${
              selectedAnswer === choice.originalIndex
                ? "border-primary bg-primary-subtle text-body-on-light"
                : "border-hairline-on-light bg-canvas-light text-body-on-light hover:bg-surface-soft-light"
            }`}
            key={`${question.id}-${choice.originalIndex}`}
            type="button"
            onClick={() => onSelect(choice.originalIndex)}
            disabled={isDisabled}
          >
            <span className="mr-2 tabular-nums text-sm font-bold text-muted/50">
              {displayIndex + 1}
            </span>
            {choice.text}
          </button>
        ))}
      </div>
    </>
  );
}

function BinaryChoicePrompt({
  prompt,
  choices,
  selectedAnswer,
  isDisabled,
  onSelect,
}: {
  prompt: string;
  choices: ShuffledChoice[];
  selectedAnswer: number | null;
  isDisabled: boolean;
  onSelect: (originalIndex: number) => void;
}) {
  useEffect(() => {
    if (isDisabled) return;
    function onKeyDown(event: KeyboardEvent) {
      const digit = parseInt(event.key, 10);
      if (digit !== 1 && digit !== 2) return;
      const el = event.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
      const choice = choices[digit - 1];
      if (choice) onSelect(choice.originalIndex);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDisabled, choices, onSelect]);

  const [beforeChoice, afterChoice] = prompt.includes("{{choice}}")
    ? prompt.split("{{choice}}")
    : [prompt, ""];

  return (
    <div className="mt-8 text-question-body leading-8 text-body-on-light">
      <span>{beforeChoice}</span>
      <span className="inline-flex flex-wrap items-center gap-2 align-baseline">
        <span>(</span>
        {choices.map((choice, index) => (
          <span
            className="inline-flex items-center gap-2"
            key={choice.originalIndex}
          >
            <button
              className={`inline-flex min-h-12 items-center gap-1 rounded-pill border px-4 text-xl font-semibold transition ${
                selectedAnswer === choice.originalIndex
                  ? "border-primary bg-primary text-on-primary"
                  : "border-hairline-on-light bg-canvas-light text-body-on-light hover:bg-surface-soft-light"
              }`}
              type="button"
              onClick={() => onSelect(choice.originalIndex)}
              disabled={isDisabled}
            >
              <span className="tabular-nums text-sm font-bold opacity-40">
                {index + 1}
              </span>
              {choice.text}
            </button>
            {index < choices.length - 1 ? (
              <span className="text-muted">/</span>
            ) : null}
          </span>
        ))}
        <span>)</span>
      </span>
      <span>{afterChoice}</span>
    </div>
  );
}

function WordArrangementPrompt({
  question,
  shuffledWords,
  selectedWordTokens,
  isDisabled,
  onSelectWord,
  onDeselectWord,
  onClearAll,
}: {
  question: WordArrangementRunnerQuestion;
  shuffledWords: ShuffledWord[];
  selectedWordTokens: ShuffledWord[];
  isDisabled: boolean;
  onSelectWord: (word: ShuffledWord) => void;
  onDeselectWord: (positionIndex: number) => void;
  onClearAll: () => void;
}) {
  const selectedOriginalIndices = new Set(
    selectedWordTokens.map((w) => w.originalIndex),
  );
  const availableWords = shuffledWords.filter(
    (w) => !selectedOriginalIndices.has(w.originalIndex),
  );

  // Fixed key labels: position in shuffledWords (1-based), never renumbered
  const keyLabelMap = new Map<number, number>();
  shuffledWords.forEach((word, idx) => {
    if (idx < 9) keyLabelMap.set(word.originalIndex, idx + 1);
  });

  useEffect(() => {
    if (isDisabled) return;
    function onKeyDown(event: KeyboardEvent) {
      const digit = parseInt(event.key, 10);
      if (isNaN(digit) || digit < 1 || digit > 9) return;
      const el = event.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
      const word = shuffledWords[digit - 1];
      if (!word) return;
      if (selectedOriginalIndices.has(word.originalIndex)) return;
      onSelectWord(word);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDisabled, shuffledWords, selectedOriginalIndices, onSelectWord]);

  return (
    <>
      <p className="text-question-body text-body-on-light">{question.prompt}</p>
      {question.hint ? (
        <p className="mt-2 text-sm leading-6 text-muted">{question.hint}</p>
      ) : null}

      <div className="mt-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            내 답안
          </p>
          {!isDisabled ? (
            <p className="text-xs tabular-nums text-muted">
              {selectedWordTokens.length} / {shuffledWords.length}
            </p>
          ) : null}
        </div>
        <div className="mt-2 min-h-14 rounded-lg border border-hairline-on-light bg-surface-strong-light p-3">
          {selectedWordTokens.length === 0 ? (
            <p className="py-1 text-sm text-muted">
              아래 단어를 눌러 순서대로 배치하세요.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedWordTokens.map((token, positionIndex) => (
                <button
                  className={`inline-flex min-h-12 items-center rounded-md border px-3 text-xl font-semibold transition ${
                    isDisabled
                      ? "border-primary/40 bg-primary-subtle text-body-on-light"
                      : "border-primary bg-primary-subtle text-body-on-light hover:border-primary hover:bg-primary/20"
                  }`}
                  key={`selected-${positionIndex}-${token.originalIndex}`}
                  type="button"
                  onClick={() => {
                    if (!isDisabled) onDeselectWord(positionIndex);
                  }}
                  disabled={isDisabled}
                >
                  {token.text}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedWordTokens.length > 0 && !isDisabled ? (
          <button
            className="mt-1.5 text-xs text-muted hover:text-body-on-light"
            type="button"
            onClick={onClearAll}
          >
            전체 지우기
          </button>
        ) : null}
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          단어 목록
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {availableWords.map((word) => {
            const keyLabel = keyLabelMap.get(word.originalIndex);
            return (
              <button
                className={`inline-flex min-h-12 items-center gap-1.5 rounded-md border px-3 text-xl font-semibold transition ${
                  isDisabled
                    ? "border-hairline-on-light bg-surface-soft-light text-muted"
                    : "border-hairline-on-light bg-canvas-light text-body-on-light hover:border-primary/40 hover:bg-surface-soft-light"
                }`}
                key={`word-${word.originalIndex}`}
                type="button"
                onClick={() => {
                  if (!isDisabled) onSelectWord(word);
                }}
                disabled={isDisabled}
              >
                {keyLabel !== undefined ? (
                  <span className="tabular-nums text-xs font-bold leading-none text-muted/50">
                    {keyLabel}
                  </span>
                ) : null}
                {word.text}
              </button>
            );
          })}
          {availableWords.length === 0 && !isDisabled ? (
            <p className="py-1 text-sm text-muted">모든 단어를 배치했습니다.</p>
          ) : null}
        </div>
      </div>
    </>
  );
}

function SentenceConstructionPrompt({
  question,
  sentenceInput,
  isDisabled,
  onInputChange,
  onSubmit,
}: {
  question: SentenceConstructionRunnerQuestion;
  sentenceInput: string;
  isDisabled: boolean;
  onInputChange: (value: string) => void;
  onSubmit?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { textareaRef.current?.focus(); }, []);

  return (
    <>
      <p className="text-question-body text-body-on-light">{question.prompt}</p>
      {question.koreanHint ? (
        <p className="mt-2 text-sm leading-6 text-muted">{question.koreanHint}</p>
      ) : null}

      {question.givenWords && question.givenWords.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            주어진 단어
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {question.givenWords.map((word, index) => (
              <span
                className="inline-flex min-h-12 items-center rounded-pill border border-hairline-on-light bg-surface-soft-light px-3 text-xl font-semibold text-body-on-light"
                key={`${word}-${index}`}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          내 답안
        </p>
        <textarea
          ref={textareaRef}
          className="mt-2 w-full resize-none rounded-lg border border-hairline-on-light bg-surface-strong-light p-3 text-xl leading-8 text-body-on-light placeholder:text-muted focus:border-primary focus:outline-none disabled:text-muted"
          rows={3}
          value={sentenceInput}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !isDisabled && sentenceInput.trim()) {
              event.preventDefault();
              onSubmit?.();
            }
          }}
          disabled={isDisabled}
          placeholder="영어 문장을 입력하세요."
        />
      </div>
    </>
  );
}

const PARSING_ROLES: { value: string; label: string }[] = [
  { value: "subject", label: "주어" },
  { value: "verb", label: "동사" },
  { value: "object", label: "목적어" },
  { value: "complement", label: "보어" },
  { value: "modifier", label: "수식어" },
  { value: "prepositional", label: "전치사구" },
];

const ROLE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  subject:      { bg: "#dbeafe", border: "#3b82f6", text: "#1d4ed8" },  // 파랑
  verb:         { bg: "#fecaca", border: "#ef4444", text: "#b91c1c" },  // 빨강
  object:       { bg: "#e9d5ff", border: "#a855f7", text: "#7e22ce" },  // 보라
  complement:   { bg: "#fed7aa", border: "#f97316", text: "#c2410c" },  // 주황
  modifier:     { bg: "#bbf7d0", border: "#22c55e", text: "#15803d" },  // 초록
  prepositional:{ bg: "#a5f3fc", border: "#06b6d4", text: "#0e7490" },  // 청록
};


function SentenceParsingPrompt({
  question,
  tokenRoles,
  activeRole,
  isDisabled,
  onSelectRole,
  onClickToken,
}: {
  question: SentenceParsingRunnerQuestion;
  tokenRoles: Record<number, string>;
  activeRole: string | null;
  isDisabled: boolean;
  onSelectRole: (role: string) => void;
  onClickToken: (index: number) => void;
}) {
  const activeColor = activeRole ? ROLE_COLORS[activeRole] : undefined;

  return (
    <>
      <p className="text-question-body text-body-on-light">{question.prompt}</p>

      {/* 역할 선택 버튼 (페인트 팔레트) */}
      {!isDisabled ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {PARSING_ROLES.map((role) => {
            const rc = ROLE_COLORS[role.value];
            const isActive = activeRole === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => onSelectRole(role.value)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition"
                style={
                  isActive && rc
                    ? { background: rc.bg, borderColor: rc.border, color: rc.text, boxShadow: `0 0 0 2px ${rc.border}` }
                    : rc
                      ? { borderColor: rc.border, color: rc.text }
                      : undefined
                }
              >
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={rc ? { background: rc.text } : undefined}
                />
                {role.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* 토큰 pill들 */}
      <div className="mt-5 flex flex-wrap gap-2">
        {question.spTokens.map((token, index) => {
          const role = tokenRoles[index];
          const roleColor = role ? ROLE_COLORS[role] : undefined;
          const canClick = !isDisabled && activeRole !== null;
          return (
            <button
              key={`sp-token-${index}`}
              type="button"
              onClick={() => onClickToken(index)}
              disabled={isDisabled || activeRole === null}
              className="inline-flex min-h-12 items-center rounded-md border px-3 text-xl font-semibold transition disabled:opacity-60"
              style={
                roleColor
                  ? { background: roleColor.bg, borderColor: roleColor.border, color: roleColor.text }
                  : canClick && activeColor
                    ? { borderColor: activeColor.border, color: "var(--color-body-on-light)" }
                    : { borderColor: "var(--color-hairline-on-light)" }
              }
            >
              {token}
            </button>
          );
        })}
      </div>

      {!isDisabled && !activeRole ? (
        <p className="mt-3 text-sm text-muted">
          위에서 성분을 선택한 뒤 토큰을 클릭하세요.
        </p>
      ) : null}
    </>
  );
}
