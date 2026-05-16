"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type MultipleChoiceQuestion = {
  id: string;
  type: "multiple_choice";
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
};

type BinaryChoiceQuestion = {
  id: string;
  type: "binary_choice";
  prompt: string;
  choices: [string, string];
  answer: 0 | 1;
  explanation: string;
};

type MockQuestion = MultipleChoiceQuestion | BinaryChoiceQuestion;

type ShuffledChoice = {
  text: string;
  originalIndex: number;
};

const mockQuestions: MockQuestion[] = [
  {
    id: "q1",
    type: "multiple_choice",
    prompt: "다음 중 어법상 올바른 문장은?",
    choices: [
      "She don't like coffee.",
      "She doesn't like coffee.",
      "She not like coffee.",
      "She isn't like coffee.",
    ],
    answer: 1,
    explanation:
      "주어 She는 3인칭 단수이므로 일반동사의 부정문은 doesn't를 사용합니다.",
  },
  {
    id: "q2",
    type: "multiple_choice",
    prompt: "빈칸에 들어갈 말로 알맞은 것은? I ___ to school yesterday.",
    choices: ["go", "goes", "went", "going"],
    answer: 2,
    explanation:
      "yesterday는 과거 시점을 나타내므로 go의 과거형 went가 알맞습니다.",
  },
  {
    id: "q3",
    type: "multiple_choice",
    prompt: "다음 중 현재완료 문장으로 알맞은 것은?",
    choices: [
      "I have finished my homework.",
      "I finished my homework tomorrow.",
      "I has finished my homework.",
      "I have finish my homework.",
    ],
    answer: 0,
    explanation:
      "현재완료는 have/has + 과거분사 형태입니다. 주어 I에는 have finished를 씁니다.",
  },
  {
    id: "q4",
    type: "binary_choice",
    prompt: "The bus {{choice}} at 7 a.m. every day.",
    choices: ["start", "starts"],
    answer: 1,
    explanation:
      "The bus는 3인칭 단수 주어이므로 현재시제 일반동사에 -s를 붙입니다.",
  },
  {
    id: "q5",
    type: "binary_choice",
    prompt: "There {{choice}} many students in the classroom.",
    choices: ["is", "are"],
    answer: 1,
    explanation:
      "many students는 복수 명사이므로 There are 형태가 알맞습니다.",
  },
];

function shuffleQuestions(questions: MockQuestion[]) {
  return [...questions].sort(() => Math.random() - 0.5);
}

function shuffleChoices(question: MockQuestion): ShuffledChoice[] {
  return question.choices
    .map((text, originalIndex) => ({
      text,
      originalIndex,
    }))
    .sort(() => Math.random() - 0.5);
}

function calculateScore(correctCount: number, totalCount: number) {
  return Math.round((correctCount / totalCount) * 100);
}

export default function MockGrammarActivityPage() {
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundQuestions, setRoundQuestions] = useState<MockQuestion[]>(mockQuestions);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [shuffledChoices, setShuffledChoices] = useState<ShuffledChoice[]>(
    () => shuffleChoices(mockQuestions[0]),
  );
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
  } | null>(null);
  const [roundCorrectCount, setRoundCorrectCount] = useState(0);
  const [roundWrongQuestions, setRoundWrongQuestions] = useState<MockQuestion[]>([]);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = roundQuestions[questionIndex];
  const progressPercent = ((questionIndex + 1) / roundQuestions.length) * 100;

  const result = useMemo(() => {
    const bestScore = roundScores.length > 0 ? Math.max(...roundScores) : 0;

    return {
      firstRoundScore: roundScores[0] ?? 0,
      bestScore,
      totalRounds: roundScores.length,
    };
  }, [roundScores]);

  function handleSubmit() {
    if (selectedAnswer === null || feedback) {
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.answer;

    setFeedback({
      isCorrect,
      explanation: currentQuestion.explanation,
    });

    if (isCorrect) {
      setRoundCorrectCount((count) => count + 1);
      return;
    }

    setRoundWrongQuestions((questions) => [...questions, currentQuestion]);
  }

  function moveToNextQuestion() {
    const isLastQuestion = questionIndex === roundQuestions.length - 1;

    if (!isLastQuestion) {
      const nextIndex = questionIndex + 1;

      setQuestionIndex(nextIndex);
      setShuffledChoices(shuffleChoices(roundQuestions[nextIndex]));
      setSelectedAnswer(null);
      setFeedback(null);
      return;
    }

    const score = calculateScore(roundCorrectCount, roundQuestions.length);
    const nextScores = [...roundScores, score];

    setRoundScores(nextScores);

    if (score === 100) {
      setIsComplete(true);
      return;
    }

    setRoundNumber((number) => number + 1);
    const nextRoundQuestions = shuffleQuestions(roundWrongQuestions);

    setRoundQuestions(nextRoundQuestions);
    setShuffledChoices(shuffleChoices(nextRoundQuestions[0]));
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setFeedback(null);
    setRoundCorrectCount(0);
    setRoundWrongQuestions([]);
  }

  if (isComplete) {
    return (
      <main className="min-h-screen bg-canvas-light px-5 py-10 text-body-on-light">
        <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-learning items-center">
          <div className="w-full rounded-xl border border-hairline-on-light bg-canvas-light p-6 sm:p-8">
            <p className="text-sm font-semibold text-primary">Activity Result</p>
            <h1 className="mt-4 text-4xl font-bold text-body-on-light">
              100점 완료
            </h1>
            <p className="mt-4 text-base leading-7 text-muted">
              모든 문항을 100점으로 마무리했습니다.
            </p>

            <dl className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-hairline-on-light bg-surface-soft-light p-5">
                <dt className="text-sm text-muted">총 라운드 수</dt>
                <dd className="mt-3 text-2xl font-semibold text-body-on-light">
                  {result.totalRounds}
                </dd>
              </div>
              <div className="rounded-lg border border-hairline-on-light bg-surface-soft-light p-5">
                <dt className="text-sm text-muted">첫 라운드 점수</dt>
                <dd className="mt-3 text-2xl font-semibold text-body-on-light">
                  {result.firstRoundScore}점
                </dd>
              </div>
              <div className="rounded-lg border border-primary bg-primary p-5 text-on-primary">
                <dt className="text-sm font-semibold">최고 점수</dt>
                <dd className="mt-3 text-2xl font-semibold">
                  {result.bestScore}점
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
          <p className="text-sm text-muted">X4 문법 훈련 01</p>
        </div>

        <div className="rounded-xl border border-hairline-on-light bg-canvas-light p-5 sm:p-8">
          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-muted">
                라운드 {roundNumber} · {questionIndex + 1}/{roundQuestions.length}
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
          </div>

          <div className="mt-10">
            {currentQuestion.type === "multiple_choice" ? (
              <>
                <p className="text-question-body text-body-on-light">
                  {currentQuestion.prompt}
                </p>
                <div className="mt-8 grid gap-3">
                  {shuffledChoices.map((choice) => (
                    <button
                      key={`${currentQuestion.id}-${choice.originalIndex}`}
                      className={`min-h-12 rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
                        selectedAnswer === choice.originalIndex
                          ? "border-primary bg-primary-subtle text-body-on-light"
                          : "border-hairline-on-light bg-canvas-light text-body-on-light hover:bg-surface-soft-light"
                      }`}
                      type="button"
                      onClick={() => setSelectedAnswer(choice.originalIndex)}
                      disabled={Boolean(feedback)}
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <BinaryChoicePrompt
                prompt={currentQuestion.prompt}
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
              <button className="button-primary" type="button" onClick={moveToNextQuestion}>
                다음 문제
              </button>
            ) : (
              <button
                className="button-primary"
                type="button"
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
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
  const [beforeChoice, afterChoice] = prompt.split("{{choice}}");

  return (
    <div className="mt-8 text-question-body leading-8 text-body-on-light">
      <span>{beforeChoice}</span>
      <span className="inline-flex flex-wrap items-center gap-2 align-baseline">
        <span>(</span>
        {choices.map((choice, index) => (
          <span
            key={choice.originalIndex}
            className="inline-flex items-center gap-2"
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
