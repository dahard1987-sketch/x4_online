"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Question } from "@/types/question";

type QuestionType = "multiple_choice" | "binary_choice";

const multipleChoiceDefaults = {
  prompt: "다음 중 어법상 올바른 문장을 선택하세요.",
  choices: [
    "She doesn't like coffee.",
    "She don't like coffee.",
    "She not like coffee.",
    "She isn't like coffee.",
  ],
  answer: 0,
};

const binaryChoiceDefaults = {
  prompt: "The bus {{choice}} at 7 a.m. every day.",
  choices: ["start", "starts"] as [string, string],
  answer: 1,
};

export default function NewQuestionPage() {
  const [questionType, setQuestionType] =
    useState<QuestionType>("multiple_choice");
  const [title, setTitle] = useState("현재시제");
  const [explanation, setExplanation] = useState(
    "주어와 시제에 맞는 동사 형태를 선택해야 합니다.",
  );
  const [multiplePrompt, setMultiplePrompt] = useState(
    multipleChoiceDefaults.prompt,
  );
  const [multipleChoices, setMultipleChoices] = useState(
    multipleChoiceDefaults.choices,
  );
  const [multipleAnswer, setMultipleAnswer] = useState(
    multipleChoiceDefaults.answer,
  );
  const [binaryPrompt, setBinaryPrompt] = useState(binaryChoiceDefaults.prompt);
  const [binaryChoices, setBinaryChoices] = useState(
    binaryChoiceDefaults.choices,
  );
  const [binaryAnswer, setBinaryAnswer] = useState(binaryChoiceDefaults.answer);
  const [showPreview, setShowPreview] = useState(true);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savedQuestionId, setSavedQuestionId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const activePrompt =
    questionType === "multiple_choice" ? multiplePrompt : binaryPrompt;

  const questionJson: Question = useMemo(() => {
    const optionalFields = {
      ...(explanation.trim() ? { explanation: explanation.trim() } : {}),
      ...(title.trim() ? { tags: [title.trim()] } : {}),
    };

    if (questionType === "multiple_choice") {
      return {
        type: "multiple_choice",
        prompt: multiplePrompt.trim(),
        choices: multipleChoices.map((choice) => choice.trim()),
        answer: multipleAnswer,
        ...optionalFields,
      };
    }

    return {
      type: "binary_choice",
      prompt: binaryPrompt.trim(),
      choices: binaryChoices.map((choice) => choice.trim()) as [
        string,
        string,
      ],
      answer: binaryAnswer as 0 | 1,
      ...optionalFields,
    };
  }, [
    binaryAnswer,
    binaryChoices,
    binaryPrompt,
    explanation,
    multipleAnswer,
    multipleChoices,
    multiplePrompt,
    questionType,
    title,
  ]);

  const jsonPreview = JSON.stringify(questionJson, null, 2);

  function validateQuestion(question: Question) {
    if (!question.prompt) {
      return "문항 본문을 입력하세요.";
    }

    if (question.type === "multiple_choice") {
      if (
        question.choices.length !== 4 ||
        question.choices.some((choice) => !choice)
      ) {
        return "객관식은 선택지 4개가 모두 필요합니다.";
      }

      if (question.answer < 0 || question.answer >= question.choices.length) {
        return "객관식 정답 번호가 유효하지 않습니다.";
      }

      return "";
    }

    if (!question.prompt.includes("{{choice}}")) {
      return "이항대립 문항 본문에는 반드시 {{choice}}가 포함되어야 합니다.";
    }

    if (
      question.choices.length !== 2 ||
      question.choices.some((choice) => !choice)
    ) {
      return "이항대립은 choice A와 choice B가 모두 필요합니다.";
    }

    if (question.answer !== 0 && question.answer !== 1) {
      return "이항대립 정답 번호가 유효하지 않습니다.";
    }

    return "";
  }

  function updateMultipleChoice(index: number, value: string) {
    setMultipleChoices((choices) =>
      choices.map((choice, choiceIndex) =>
        choiceIndex === index ? value : choice,
      ),
    );
  }

  function updateBinaryChoice(index: number, value: string) {
    setBinaryChoices((choices) =>
      choices.map((choice, choiceIndex) =>
        choiceIndex === index ? value : choice,
      ) as [string, string],
    );
  }

  async function handleCopyJson() {
    await navigator.clipboard.writeText(jsonPreview);
    setNotice("JSON을 클립보드에 복사했습니다.");
    setErrorMessage("");
  }

  async function handleSaveQuestion() {
    setNotice("");
    setErrorMessage("");
    setSavedQuestionId("");

    const validationError = validateQuestion(questionJson);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const docRef = await addDoc(collection(db, "questions"), {
        ...questionJson,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSavedQuestionId(docRef.id);
      setNotice("저장되었습니다. 입력값은 초기화하지 않았습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `저장 실패: ${error.message}`
          : "문항 저장 중 알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas-dark text-body-on-dark">
      <header className="sticky top-0 z-20 border-b border-hairline-on-dark bg-surface-card-dark">
        <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src="/canb-logo.png"
                alt="CANB English"
                width={1109}
                height={544}
                priority
                className="h-8 w-auto"
              />
              <span className="hidden text-sm font-semibold text-muted sm:inline">
                CANB Admin
              </span>
            </div>

            <span className="rounded-sm border border-primary/40 bg-canvas-dark px-3 py-2 text-sm font-bold text-primary">
              001
            </span>

            <select
              className="h-10 min-w-36 rounded-md border border-hairline-on-dark bg-canvas-dark px-3 text-sm font-semibold text-body-on-dark"
              value={questionType}
              onChange={(event) =>
                setQuestionType(event.target.value as QuestionType)
              }
            >
              <option value="multiple_choice">객관식</option>
              <option value="binary_choice">이항대립</option>
            </select>

            <div className="min-w-0 flex-1 text-center text-sm font-semibold text-body-on-dark">
              문항 / 정답 입력
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="button-secondary-on-dark"
                type="button"
                onClick={() => setShowPreview((value) => !value)}
              >
                {showPreview ? "미리보기 숨김" : "미리보기"}
              </button>
              <Link className="button-secondary-on-dark" href="/admin/questions">
                문제 목록
              </Link>
              <button
                className="button-primary"
                type="button"
                onClick={handleSaveQuestion}
                disabled={isSaving}
              >
                {isSaving ? "저장 중" : "저장"}
              </button>
            </div>
          </div>

          {(notice || savedQuestionId || errorMessage) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {notice ? (
                <span className="rounded-sm border border-correct/40 bg-canvas-dark px-3 py-2 text-correct">
                  {notice}
                </span>
              ) : null}
              {savedQuestionId ? (
                <span className="rounded-sm border border-hairline-on-dark bg-canvas-dark px-3 py-2 text-body-on-dark">
                  문서 ID: <span className="font-semibold text-primary">{savedQuestionId}</span>
                </span>
              ) : null}
              {errorMessage ? (
                <span className="rounded-sm border border-incorrect bg-canvas-dark px-3 py-2 text-body-on-dark">
                  {errorMessage}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-page px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[55fr_45fr]">
          <section className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-primary">01 문항 입력</p>
              <label className="flex min-w-0 items-center gap-2 text-xs text-muted">
                태그
                <input
                  className="h-9 w-32 rounded-md border border-hairline-on-dark bg-canvas-dark px-3 text-sm text-body-on-dark"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="optional"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="sr-only">문항 본문</span>
              <textarea
                className="field-on-dark min-h-[360px] resize-y text-base leading-7"
                value={activePrompt}
                onChange={(event) => {
                  if (questionType === "multiple_choice") {
                    setMultiplePrompt(event.target.value);
                    return;
                  }

                  setBinaryPrompt(event.target.value);
                }}
                placeholder={
                  questionType === "multiple_choice"
                    ? "다음 중 어법상 올바른 문장을 선택하세요."
                    : "The bus {{choice}} at 7 a.m. every day."
                }
              />
            </label>

            {questionType === "binary_choice" ? (
              <p className="mt-2 text-xs leading-5 text-muted">
                선택지가 들어갈 위치에 {"{{choice}}"}를 넣으세요.
              </p>
            ) : null}
          </section>

          <section className="grid gap-4">
            <div className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-4 sm:p-5">
              <p className="text-sm font-semibold text-primary">
                02 선택지 / 정답
              </p>

              {questionType === "multiple_choice" ? (
                <MultipleChoiceEditor
                  choices={multipleChoices}
                  answer={multipleAnswer}
                  onChoiceChange={updateMultipleChoice}
                  onAnswerChange={setMultipleAnswer}
                />
              ) : (
                <BinaryChoiceEditor
                  prompt={binaryPrompt}
                  choices={binaryChoices}
                  answer={binaryAnswer}
                  onChoiceChange={updateBinaryChoice}
                  onAnswerChange={setBinaryAnswer}
                />
              )}

              <label className="mt-5 block">
                <span className="text-sm font-semibold text-body-on-dark">
                  해설
                </span>
                <textarea
                  className="field-on-dark mt-2 min-h-24 resize-y"
                  value={explanation}
                  onChange={(event) => setExplanation(event.target.value)}
                  placeholder="학생에게 보여줄 해설을 입력하세요."
                />
              </label>
            </div>

            {showPreview ? (
              <section className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-4">
                <p className="text-sm font-semibold text-primary">
                  학생 화면 미리보기
                </p>
                <StudentPreview
                  questionType={questionType}
                  multiplePrompt={multiplePrompt}
                  multipleChoices={multipleChoices}
                  multipleAnswer={multipleAnswer}
                  binaryPrompt={binaryPrompt}
                  binaryChoices={binaryChoices}
                  binaryAnswer={binaryAnswer}
                />
              </section>
            ) : null}

            <details className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-4">
              <summary className="cursor-pointer text-sm font-semibold text-muted">
                JSON Preview
              </summary>
              <pre className="mt-4 max-h-72 overflow-auto rounded-lg border border-hairline-on-dark bg-canvas-dark p-4 text-xs leading-6 text-body-on-dark">
                {jsonPreview}
              </pre>
              <button
                className="button-secondary-on-dark mt-3"
                type="button"
                onClick={handleCopyJson}
              >
                JSON 복사
              </button>
            </details>
          </section>
        </div>
      </section>
    </main>
  );
}

function MultipleChoiceEditor({
  choices,
  answer,
  onChoiceChange,
  onAnswerChange,
}: {
  choices: string[];
  answer: number;
  onChoiceChange: (index: number, value: string) => void;
  onAnswerChange: (index: number) => void;
}) {
  return (
    <div className="mt-4 grid gap-2">
      {choices.map((choice, index) => {
        const isAnswer = answer === index;

        return (
          <div
            className={`grid grid-cols-[44px_1fr] gap-2 rounded-lg border p-2 ${
              isAnswer
                ? "border-primary bg-canvas-dark"
                : "border-hairline-on-dark bg-canvas-dark"
            }`}
            key={index}
          >
            <button
              className={`inline-flex h-10 items-center justify-center rounded-md border text-sm font-bold transition ${
                isAnswer
                  ? "border-primary bg-primary text-on-primary"
                  : "border-hairline-on-dark bg-surface-card-dark text-muted hover:text-body-on-dark"
              }`}
              type="button"
              onClick={() => onAnswerChange(index)}
              aria-label={`${index + 1}번 정답 선택`}
            >
              {index + 1}
            </button>
            <input
              className="field-on-dark h-10 min-h-10"
              value={choice}
              onChange={(event) => onChoiceChange(index, event.target.value)}
              placeholder={`choice ${index + 1}`}
            />
          </div>
        );
      })}
    </div>
  );
}

function BinaryChoiceEditor({
  prompt,
  choices,
  answer,
  onChoiceChange,
  onAnswerChange,
}: {
  prompt: string;
  choices: [string, string];
  answer: number;
  onChoiceChange: (index: number, value: string) => void;
  onAnswerChange: (index: number) => void;
}) {
  return (
    <div className="mt-4 grid gap-3">
      {choices.map((choice, index) => {
        const isAnswer = answer === index;

        return (
          <div
            className={`grid grid-cols-[44px_1fr] gap-2 rounded-lg border p-2 ${
              isAnswer
                ? "border-primary bg-canvas-dark"
                : "border-hairline-on-dark bg-canvas-dark"
            }`}
            key={index}
          >
            <button
              className={`inline-flex h-10 items-center justify-center rounded-md border text-sm font-bold transition ${
                isAnswer
                  ? "border-primary bg-primary text-on-primary"
                  : "border-hairline-on-dark bg-surface-card-dark text-muted hover:text-body-on-dark"
              }`}
              type="button"
              onClick={() => onAnswerChange(index)}
              aria-label={`choice ${index === 0 ? "A" : "B"} 정답 선택`}
            >
              {index === 0 ? "A" : "B"}
            </button>
            <input
              className="field-on-dark h-10 min-h-10"
              value={choice}
              onChange={(event) => onChoiceChange(index, event.target.value)}
              placeholder={`choice ${index === 0 ? "A" : "B"}`}
            />
          </div>
        );
      })}

      <InlineBinaryPreview
        prompt={prompt}
        choices={choices}
        answer={answer}
        tone="dark"
      />
    </div>
  );
}

function StudentPreview({
  questionType,
  multiplePrompt,
  multipleChoices,
  multipleAnswer,
  binaryPrompt,
  binaryChoices,
  binaryAnswer,
}: {
  questionType: QuestionType;
  multiplePrompt: string;
  multipleChoices: string[];
  multipleAnswer: number;
  binaryPrompt: string;
  binaryChoices: [string, string];
  binaryAnswer: number;
}) {
  if (questionType === "binary_choice") {
    return (
      <div className="mt-3 rounded-lg border border-hairline-on-dark bg-canvas-dark p-4">
        <InlineBinaryPreview
          prompt={binaryPrompt}
          choices={binaryChoices}
          answer={binaryAnswer}
          tone="dark"
        />
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-hairline-on-dark bg-canvas-dark p-4">
      <p className="text-sm font-semibold leading-6 text-body-on-dark">
        {multiplePrompt || "문항 본문"}
      </p>
      <div className="mt-3 grid gap-2">
        {multipleChoices.map((choice, index) => {
          const isAnswer = multipleAnswer === index;

          return (
            <div
              className={`rounded-md border px-3 py-2 text-sm ${
                isAnswer
                  ? "border-primary bg-primary/20 text-body-on-dark"
                  : "border-hairline-on-dark text-muted"
              }`}
              key={index}
            >
              {choice || `choice ${index + 1}`}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InlineBinaryPreview({
  prompt,
  choices,
  answer,
}: {
  prompt: string;
  choices: [string, string];
  answer: number;
  tone: "dark";
}) {
  const [beforeChoice, afterChoice] = prompt.includes("{{choice}}")
    ? prompt.split("{{choice}}")
    : [prompt, ""];

  return (
    <p className="text-sm leading-8 text-body-on-dark">
      <span>{beforeChoice || "문장 앞부분 "}</span>
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="text-muted">(</span>
        {choices.map((choice, index) => (
          <span className="inline-flex items-center gap-2" key={index}>
            <span
              className={`inline-flex min-h-8 items-center rounded-pill border px-3 text-sm font-semibold ${
                answer === index
                  ? "border-primary bg-primary text-on-primary"
                  : "border-hairline-on-dark bg-surface-card-dark text-body-on-dark"
              }`}
            >
              {choice || `choice ${index === 0 ? "A" : "B"}`}
            </span>
            {index === 0 ? <span className="text-muted">/</span> : null}
          </span>
        ))}
        <span className="text-muted">)</span>
      </span>
      <span>{afterChoice}</span>
    </p>
  );
}
