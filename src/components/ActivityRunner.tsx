"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type ActivityRunnerQuestion = {
  id: string;
  type: string;
  prompt: string;
  choices?: string[];
  answer?: number;
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

type RoundMode = "full" | "review";

type RoundQuestionState = {
  roundQuestions: ActivityRunnerQuestion[];
  shuffledChoices: ShuffledChoice[];
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

export default function ActivityRunner({
  activityTitle,
  questions,
}: {
  activityTitle: string;
  questions: ActivityRunnerQuestion[];
}) {
  const [roundMode, setRoundMode] = useState<RoundMode>("full");
  const [fullRoundNumber, setFullRoundNumber] = useState(1);
  const [reviewRoundNumber, setReviewRoundNumber] = useState(0);
  const [roundState, setRoundState] = useState<RoundQuestionState>(() =>
    startFullRound(questions),
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
  } | null>(null);
  const [roundCorrectCount, setRoundCorrectCount] = useState(0);
  const [roundWrongQuestions, setRoundWrongQuestions] = useState<
    ActivityRunnerQuestion[]
  >([]);
  const [fullRoundScores, setFullRoundScores] = useState<number[]>([]);
  const [totalAnsweredCount, setTotalAnsweredCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const { roundQuestions, shuffledChoices } = roundState;
  const currentQuestion = roundQuestions[questionIndex];
  const supportedCurrentQuestion =
    currentQuestion && isSupportedQuestion(currentQuestion)
      ? currentQuestion
      : null;
  const progressPercent =
    roundQuestions.length > 0
      ? ((questionIndex + 1) / roundQuestions.length) * 100
      : 0;

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
    if (
      selectedAnswer === null ||
      feedback ||
      !currentQuestion ||
      !isSupportedQuestion(currentQuestion)
    ) {
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.answer;

    setTotalAnsweredCount((count) => count + 1);
    setFeedback({
      isCorrect,
      explanation: currentQuestion.explanation || "해설이 아직 없습니다.",
    });

    if (roundMode === "review") {
      return;
    }

    if (isCorrect) {
      setRoundCorrectCount((count) => count + 1);
      return;
    }

    setRoundWrongQuestions((questionsInRound) => [
      ...questionsInRound,
      currentQuestion,
    ]);
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
      }));
      setSelectedAnswer(null);
      setFeedback(null);
      return;
    }

    if (roundMode === "review") {
      setRoundMode("full");
      setFullRoundNumber((number) => number + 1);
      setRoundState(startFullRound(questions));
      setQuestionIndex(0);
      setSelectedAnswer(null);
      setFeedback(null);
      setRoundCorrectCount(0);
      setRoundWrongQuestions([]);
      return;
    }

    const score = calculateScore(roundCorrectCount, roundQuestions.length);
    const nextScores = [...fullRoundScores, score];

    setFullRoundScores(nextScores);

    if (score === 100) {
      setIsComplete(true);
      return;
    }

    setRoundMode("review");
    setReviewRoundNumber((number) => number + 1);
    setRoundState(startReviewRound(roundWrongQuestions));
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setFeedback(null);
    setRoundCorrectCount(0);
    setRoundWrongQuestions([]);
  }

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
        <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-learning items-center">
          <div className="w-full rounded-xl border border-hairline-on-light bg-canvas-light p-6 sm:p-8">
            <p className="text-sm font-semibold text-primary">
              Activity Result
            </p>
            <h1 className="mt-4 text-4xl font-bold text-body-on-light">
              100점 완료
            </h1>
            <p className="mt-4 text-base leading-7 text-muted">
              모든 문항을 100점으로 마무리했습니다.
            </p>

            <dl className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-hairline-on-light bg-surface-soft-light p-5">
                <dt className="text-sm text-muted">첫 전체 풀이 점수</dt>
                <dd className="mt-3 text-2xl font-semibold text-body-on-light">
                  {result.firstRoundScore}점
                </dd>
              </div>
              <div className="rounded-lg border border-hairline-on-light bg-surface-soft-light p-5">
                <dt className="text-sm text-muted">최고 전체 풀이 점수</dt>
                <dd className="mt-3 text-2xl font-semibold text-body-on-light">
                  {result.bestScore}점
                </dd>
              </div>
              <div className="rounded-lg border border-primary bg-primary p-5 text-on-primary">
                <dt className="text-sm font-semibold">최종 점수</dt>
                <dd className="mt-3 text-2xl font-semibold">
                  {result.finalScore}점
                </dd>
              </div>
              <div className="rounded-lg border border-hairline-on-light bg-surface-soft-light p-5">
                <dt className="text-sm text-muted">전체 풀이 횟수</dt>
                <dd className="mt-3 text-2xl font-semibold text-body-on-light">
                  {result.totalFullRounds}
                </dd>
              </div>
              <div className="rounded-lg border border-hairline-on-light bg-surface-soft-light p-5">
                <dt className="text-sm text-muted">오답 복습 횟수</dt>
                <dd className="mt-3 text-2xl font-semibold text-body-on-light">
                  {result.totalReviewRounds}
                </dd>
              </div>
              <div className="rounded-lg border border-hairline-on-light bg-surface-soft-light p-5">
                <dt className="text-sm text-muted">총 풀이 문항 수</dt>
                <dd className="mt-3 text-2xl font-semibold text-body-on-light">
                  {result.totalAnsweredCount}
                </dd>
              </div>
            </dl>

            <Link className="button-primary mt-8" href="/dashboard">
              대시보드로 돌아가기
            </Link>
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
            {!supportedCurrentQuestion ? (
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
                  ? "border-correct bg-[#f0fbf6]"
                  : "border-incorrect bg-[#fff2f2]"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  feedback.isCorrect ? "text-correct" : "text-incorrect"
                }`}
              >
                {feedback.isCorrect ? "정답입니다." : "오답입니다."}
              </p>
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
                className="button-primary"
                type="button"
                onClick={handleSubmit}
                disabled={selectedAnswer === null || !supportedCurrentQuestion}
              >
                제출
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
    <div className="rounded-lg border border-incorrect bg-[#fff2f2] p-5">
      <p className="text-sm font-semibold text-incorrect">
        아직 지원하지 않는 문항 유형입니다.
      </p>
      <p className="mt-2 text-sm leading-6 text-body-on-light">
        현재 풀이 화면은 객관식과 이항대립 문항만 지원합니다.
      </p>
    </div>
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
  return (
    <>
      <p className="text-question-body text-body-on-light">{question.prompt}</p>
      <div className="mt-8 grid gap-3">
        {choices.map((choice) => (
          <button
            className={`min-h-12 rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
              selectedAnswer === choice.originalIndex
                ? "border-primary bg-primary-subtle text-body-on-light"
                : "border-hairline-on-light bg-canvas-light text-body-on-light hover:bg-surface-soft-light"
            }`}
            key={`${question.id}-${choice.originalIndex}`}
            type="button"
            onClick={() => onSelect(choice.originalIndex)}
            disabled={isDisabled}
          >
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
              className={`inline-flex min-h-9 items-center rounded-pill border px-3 text-sm font-semibold transition ${
                selectedAnswer === choice.originalIndex
                  ? "border-primary bg-primary text-on-primary"
                  : "border-hairline-on-light bg-canvas-light text-body-on-light hover:bg-surface-soft-light"
              }`}
              type="button"
              onClick={() => onSelect(choice.originalIndex)}
              disabled={isDisabled}
            >
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
