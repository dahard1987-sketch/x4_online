"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Question } from "@/types/question";

type QuestionType = "multiple_choice" | "binary_choice";

const multipleChoiceDefaults = {
  prompt: "다음 중 어법상 올바른 문장은?",
  choices: [
    "She don't like coffee.",
    "She doesn't like coffee.",
    "She not like coffee.",
    "She isn't like coffee.",
  ],
  answer: 1,
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
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savedQuestionId, setSavedQuestionId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
      return "prompt를 입력하세요.";
    }

    if (question.type === "multiple_choice") {
      if (question.choices.length !== 4 || question.choices.some((choice) => !choice)) {
        return "객관식은 choice 4개가 모두 필요합니다.";
      }

      if (question.answer < 0 || question.answer >= question.choices.length) {
        return "객관식 정답 인덱스가 유효하지 않습니다.";
      }

      return "";
    }

    if (!question.prompt.includes("{{choice}}")) {
      return "이항대립 prompt에는 반드시 {{choice}}가 포함되어야 합니다.";
    }

    if (question.choices.length !== 2 || question.choices.some((choice) => !choice)) {
      return "이항대립은 choice 2개가 모두 필요합니다.";
    }

    if (question.answer !== 0 && question.answer !== 1) {
      return "이항대립 정답 인덱스가 유효하지 않습니다.";
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
      setNotice("저장되었습니다. 입력값은 이어서 확인할 수 있도록 초기화하지 않았습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "문항 저장 중 알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas-dark text-body-on-dark">
      <header className="border-b border-hairline-on-dark bg-canvas-dark">
        <nav className="mx-auto flex min-h-16 max-w-page items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Image
            src="/canb-logo.png"
            alt="CANB English"
            width={1109}
            height={544}
            priority
            className="h-9 w-auto"
          />
          <Link className="button-secondary-on-dark" href="/dashboard">
            대시보드로 돌아가기
          </Link>
          <Link className="button-secondary-on-dark" href="/admin/questions">
            문제 목록 보기
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-page px-5 py-10 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Question Builder</p>
          <h1 className="mt-3 text-3xl font-bold text-body-on-dark sm:text-display-lg">
            문항 만들기
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            Firestore 저장 없이 입력값과 JSON 구조만 확인하는 mock
            화면입니다.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-5 sm:p-6">
            <div>
              <p className="text-sm font-semibold text-body-on-dark">
                유형 선택
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "객관식", value: "multiple_choice" },
                  { label: "이항대립", value: "binary_choice" },
                ].map((option) => (
                  <button
                    key={option.value}
                    className={`min-h-11 rounded-md border px-4 text-sm font-semibold transition ${
                      questionType === option.value
                        ? "border-primary bg-primary text-on-primary"
                        : "border-hairline-on-dark bg-canvas-dark text-body-on-dark hover:bg-surface-elevated-dark"
                    }`}
                    type="button"
                    onClick={() => setQuestionType(option.value as QuestionType)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-5">
              <label className="block">
                <span className="text-sm font-semibold text-body-on-dark">
                  문항 제목 또는 태그 optional
                </span>
                <input
                  className="field-on-dark mt-2"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-body-on-dark">
                  explanation
                </span>
                <textarea
                  className="field-on-dark mt-2 min-h-28"
                  value={explanation}
                  onChange={(event) => setExplanation(event.target.value)}
                />
              </label>

              {questionType === "multiple_choice" ? (
                <MultipleChoiceFields
                  prompt={multiplePrompt}
                  choices={multipleChoices}
                  answer={multipleAnswer}
                  onPromptChange={setMultiplePrompt}
                  onChoiceChange={updateMultipleChoice}
                  onAnswerChange={setMultipleAnswer}
                />
              ) : (
                <BinaryChoiceFields
                  prompt={binaryPrompt}
                  choices={binaryChoices}
                  answer={binaryAnswer}
                  onPromptChange={setBinaryPrompt}
                  onChoiceChange={updateBinaryChoice}
                  onAnswerChange={setBinaryAnswer}
                />
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                className="button-primary"
                type="button"
                onClick={handleSaveQuestion}
                disabled={isSaving}
              >
                {isSaving ? "저장 중" : "저장"}
              </button>
              <button
                className="button-secondary-on-dark"
                type="button"
                onClick={handleCopyJson}
              >
                JSON 복사
              </button>
            </div>

            {notice ? (
              <p className="mt-4 rounded-lg border border-correct/40 bg-canvas-dark px-4 py-3 text-sm text-correct">
                {notice}
              </p>
            ) : null}

            {savedQuestionId ? (
              <p className="mt-3 rounded-lg border border-hairline-on-dark bg-canvas-dark px-4 py-3 text-sm text-body-on-dark">
                저장된 문서 ID: <span className="font-semibold text-primary">{savedQuestionId}</span>
              </p>
            ) : null}

            {errorMessage ? (
              <p className="mt-3 rounded-lg border border-incorrect bg-canvas-dark px-4 py-3 text-sm text-body-on-dark">
                {errorMessage}
              </p>
            ) : null}
          </section>

          <aside className="grid gap-5">
            <section className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-5">
              <p className="text-sm font-semibold text-primary">Preview</p>
              <StudentPreview
                questionType={questionType}
                multiplePrompt={multiplePrompt}
                multipleChoices={multipleChoices}
                binaryPrompt={binaryPrompt}
                binaryChoices={binaryChoices}
              />
            </section>

            <section className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-5">
              <p className="text-sm font-semibold text-primary">JSON Preview</p>
              <pre className="mt-4 max-h-[420px] overflow-auto rounded-lg border border-hairline-on-dark bg-canvas-dark p-4 text-xs leading-6 text-body-on-dark">
                {jsonPreview}
              </pre>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function MultipleChoiceFields({
  prompt,
  choices,
  answer,
  onPromptChange,
  onChoiceChange,
  onAnswerChange,
}: {
  prompt: string;
  choices: string[];
  answer: number;
  onPromptChange: (value: string) => void;
  onChoiceChange: (index: number, value: string) => void;
  onAnswerChange: (index: number) => void;
}) {
  return (
    <div className="grid gap-5">
      <label className="block">
        <span className="text-sm font-semibold text-body-on-dark">prompt</span>
        <textarea
          className="field-on-dark mt-2 min-h-28"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
        />
      </label>

      <div className="grid gap-3">
        {choices.map((choice, index) => (
          <label className="block" key={index}>
            <span className="text-sm font-semibold text-body-on-dark">
              choice {index + 1}
            </span>
            <input
              className="field-on-dark mt-2"
              value={choice}
              onChange={(event) => onChoiceChange(index, event.target.value)}
            />
          </label>
        ))}
      </div>

      <AnswerSelect
        count={choices.length}
        value={answer}
        onChange={onAnswerChange}
      />
    </div>
  );
}

function BinaryChoiceFields({
  prompt,
  choices,
  answer,
  onPromptChange,
  onChoiceChange,
  onAnswerChange,
}: {
  prompt: string;
  choices: [string, string];
  answer: number;
  onPromptChange: (value: string) => void;
  onChoiceChange: (index: number, value: string) => void;
  onAnswerChange: (index: number) => void;
}) {
  return (
    <div className="grid gap-5">
      <label className="block">
        <span className="text-sm font-semibold text-body-on-dark">prompt</span>
        <textarea
          className="field-on-dark mt-2 min-h-28"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
        />
        <span className="mt-2 block text-xs leading-5 text-muted">
          반드시 {"{{choice}}"} placeholder를 사용하세요. 예: The bus {"{{choice}}"} at 7 a.m. every day.
        </span>
      </label>

      {choices.map((choice, index) => (
        <label className="block" key={index}>
          <span className="text-sm font-semibold text-body-on-dark">
            choice {index === 0 ? "A" : "B"}
          </span>
          <input
            className="field-on-dark mt-2"
            value={choice}
            onChange={(event) => onChoiceChange(index, event.target.value)}
          />
        </label>
      ))}

      <AnswerSelect count={2} value={answer} onChange={onAnswerChange} />
    </div>
  );
}

function AnswerSelect({
  count,
  value,
  onChange,
}: {
  count: number;
  value: number;
  onChange: (index: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-body-on-dark">정답 선택</span>
      <select
        className="field-on-dark mt-2"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {Array.from({ length: count }, (_, index) => (
          <option key={index} value={index}>
            {index + 1}번
          </option>
        ))}
      </select>
    </label>
  );
}

function StudentPreview({
  questionType,
  multiplePrompt,
  multipleChoices,
  binaryPrompt,
  binaryChoices,
}: {
  questionType: QuestionType;
  multiplePrompt: string;
  multipleChoices: string[];
  binaryPrompt: string;
  binaryChoices: [string, string];
}) {
  if (questionType === "binary_choice") {
    const [beforeChoice, afterChoice] = binaryPrompt.split("{{choice}}");

    return (
      <div className="mt-4 rounded-lg border border-hairline-on-dark bg-canvas-dark p-4">
        <p className="text-base leading-8 text-body-on-dark">
          <span>{beforeChoice}</span>
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>(</span>
            {binaryChoices.map((choice, index) => (
              <span className="inline-flex items-center gap-2" key={index}>
                <span className="inline-flex min-h-8 items-center rounded-pill border border-hairline-on-dark px-3 text-sm font-semibold">
                  {choice || `choice ${index + 1}`}
                </span>
                {index === 0 ? <span className="text-muted">/</span> : null}
              </span>
            ))}
            <span>)</span>
          </span>
          <span>{afterChoice}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-hairline-on-dark bg-canvas-dark p-4">
      <p className="text-base font-semibold leading-7 text-body-on-dark">
        {multiplePrompt}
      </p>
      <div className="mt-4 grid gap-2">
        {multipleChoices.map((choice, index) => (
          <div
            className="rounded-md border border-hairline-on-dark px-3 py-2 text-sm text-body-on-dark"
            key={index}
          >
            {choice || `choice ${index + 1}`}
          </div>
        ))}
      </div>
    </div>
  );
}
