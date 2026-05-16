"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  buildWordArrangementTokens,
  tokenizeSentenceForWordArrangement,
} from "@/lib/wordArrangement";
import {
  parseAcceptableAnswers,
  parseGivenWords,
} from "@/lib/sentenceConstruction";
import type { Question } from "@/types/question";

type QuestionType =
  | "multiple_choice"
  | "binary_choice"
  | "word_arrangement"
  | "sentence_construction";

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

const wordArrangementDefaults = {
  prompt: "주어진 단어를 배열해 문장을 완성하세요.",
  hint: "John은 서울에 갈 수 없다.",
  answerSentence: "John can't go to Seoul.",
};

const sentenceConstructionDefaults = {
  prompt: "주어진 단어를 활용하고 필요한 표현을 추가해 문장을 완성하세요.",
  koreanHint: "나는 어제 도서관에 갔다.",
  givenWordsRaw: "I / go / library / yesterday",
  answer: "I went to the library yesterday.",
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
  const [wordPrompt, setWordPrompt] = useState(wordArrangementDefaults.prompt);
  const [wordHint, setWordHint] = useState(wordArrangementDefaults.hint);
  const [wordAnswerSentence, setWordAnswerSentence] = useState(
    wordArrangementDefaults.answerSentence,
  );
  const [properNounIndices, setProperNounIndices] = useState<number[]>([0, 4]);
  const [scPrompt, setScPrompt] = useState(sentenceConstructionDefaults.prompt);
  const [scKoreanHint, setScKoreanHint] = useState(
    sentenceConstructionDefaults.koreanHint,
  );
  const [scGivenWordsRaw, setScGivenWordsRaw] = useState(
    sentenceConstructionDefaults.givenWordsRaw,
  );
  const [scAnswer, setScAnswer] = useState(sentenceConstructionDefaults.answer);
  const [scAcceptableAnswersRaw, setScAcceptableAnswersRaw] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savedQuestionId, setSavedQuestionId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const wordTokens = useMemo(
    () => tokenizeSentenceForWordArrangement(wordAnswerSentence),
    [wordAnswerSentence],
  );
  const wordTokenData = useMemo(
    () => buildWordArrangementTokens(wordAnswerSentence, properNounIndices),
    [properNounIndices, wordAnswerSentence],
  );

  const activePrompt =
    questionType === "multiple_choice"
      ? multiplePrompt
      : questionType === "binary_choice"
        ? binaryPrompt
        : questionType === "word_arrangement"
          ? wordPrompt
          : scPrompt;

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

    if (questionType === "binary_choice") {
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
    }

    if (questionType === "sentence_construction") {
      const parsedWords = parseGivenWords(scGivenWordsRaw);
      const parsedAcceptable = parseAcceptableAnswers(scAcceptableAnswersRaw);
      return {
        type: "sentence_construction",
        prompt: scPrompt.trim(),
        koreanHint: scKoreanHint.trim(),
        givenWords: parsedWords,
        answer: scAnswer.trim(),
        ...(parsedAcceptable.length > 0
          ? { acceptableAnswers: parsedAcceptable }
          : {}),
        ...optionalFields,
      };
    }

    return {
      type: "word_arrangement",
      prompt: wordPrompt.trim(),
      ...(wordHint.trim() ? { hint: wordHint.trim() } : {}),
      words: wordTokenData.words,
      answer: wordTokenData.answer,
      ...(wordTokenData.properNounIndices.length > 0
        ? { properNounIndices: wordTokenData.properNounIndices }
        : {}),
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
    scAcceptableAnswersRaw,
    scAnswer,
    scGivenWordsRaw,
    scKoreanHint,
    scPrompt,
    title,
    wordHint,
    wordPrompt,
    wordTokenData,
  ]);

  const jsonPreview = JSON.stringify(questionJson, null, 2);

  function validateQuestion(question: Question) {
    if (!question.prompt) {
      return "문항 본문을 입력하세요.";
    }

    if (question.type === "word_arrangement") {
      if (!wordAnswerSentence.trim()) {
        return "정답 문장을 입력하세요.";
      }

      if (question.answer.length < 2) {
        return "단어 배열 문항은 정답 토큰이 2개 이상 필요합니다.";
      }

      if (question.words.length < 2) {
        return "단어 배열 문항은 문제용 단어가 2개 이상 필요합니다.";
      }

      return "";
    }

    if (question.type === "sentence_construction") {
      if (!question.koreanHint.trim()) {
        return "한국어 힌트를 입력하세요.";
      }

      if (question.givenWords.length === 0) {
        return "주어진 단어를 1개 이상 입력하세요.";
      }

      if (!question.answer.trim()) {
        return "정답 문장을 입력하세요.";
      }

      return "";
    }

    if (question.type === "binary_choice") {
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
              <Link href="/dashboard">
                <Image
                  src="/canb-logo.png"
                  alt="CANB English"
                  width={1109}
                  height={544}
                  priority
                  className="h-8 w-auto"
                />
              </Link>
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
              <option value="word_arrangement">단어 배열</option>
              <option value="sentence_construction">문장 완성</option>
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
              <Link
                className="button-secondary-on-dark"
                href="/admin/activities/new"
              >
                활동 만들기
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
                  문서 ID:{" "}
                  <span className="font-semibold text-primary">
                    {savedQuestionId}
                  </span>
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
                className={`field-on-dark resize-y text-base leading-7 ${
                  questionType === "multiple_choice" ? "min-h-44" : "min-h-20"
                }`}
                value={activePrompt}
                onChange={(event) => {
                  if (questionType === "multiple_choice") {
                    setMultiplePrompt(event.target.value);
                    return;
                  }
                  if (questionType === "binary_choice") {
                    setBinaryPrompt(event.target.value);
                    return;
                  }
                  if (questionType === "word_arrangement") {
                    setWordPrompt(event.target.value);
                    return;
                  }
                  setScPrompt(event.target.value);
                }}
                placeholder={
                  questionType === "multiple_choice"
                    ? "다음 중 어법상 올바른 문장을 선택하세요."
                    : questionType === "binary_choice"
                      ? "The bus {{choice}} at 7 a.m. every day."
                      : questionType === "word_arrangement"
                        ? "주어진 단어를 배열해 문장을 완성하세요."
                        : "주어진 단어를 활용하고 필요한 표현을 추가해 문장을 완성하세요."
                }
              />
            </label>

            {questionType === "binary_choice" ? (
              <p className="mt-2 text-xs leading-5 text-muted">
                선택지가 들어갈 위치에 {"{{choice}}"}를 넣으세요.
              </p>
            ) : null}

            {questionType === "word_arrangement" ? (
              <p className="mt-2 text-xs leading-5 text-muted">
                정답 문장을 입력하면 단어 토큰과 문제용 word bank가 자동으로
                생성됩니다.
              </p>
            ) : null}

            {questionType === "sentence_construction" ? (
              <p className="mt-2 text-xs leading-5 text-muted">
                학생이 주어진 단어를 활용해 직접 문장을 완성하는 유형입니다.
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
              ) : questionType === "binary_choice" ? (
                <BinaryChoiceEditor
                  prompt={binaryPrompt}
                  choices={binaryChoices}
                  answer={binaryAnswer}
                  onChoiceChange={updateBinaryChoice}
                  onAnswerChange={setBinaryAnswer}
                />
              ) : questionType === "sentence_construction" ? (
                <SentenceConstructionEditor
                  koreanHint={scKoreanHint}
                  givenWordsRaw={scGivenWordsRaw}
                  answer={scAnswer}
                  acceptableAnswersRaw={scAcceptableAnswersRaw}
                  onKoreanHintChange={setScKoreanHint}
                  onGivenWordsRawChange={setScGivenWordsRaw}
                  onAnswerChange={setScAnswer}
                  onAcceptableAnswersRawChange={setScAcceptableAnswersRaw}
                />
              ) : (
                <WordArrangementEditor
                  hint={wordHint}
                  answerSentence={wordAnswerSentence}
                  rawTokens={wordTokens}
                  words={wordTokenData.words}
                  properNounIndices={properNounIndices}
                  onHintChange={setWordHint}
                  onAnswerSentenceChange={(value) => {
                    setWordAnswerSentence(value);
                    setProperNounIndices((indices) => {
                      const nextTokenCount =
                        tokenizeSentenceForWordArrangement(value).length;

                      return indices.filter((index) => index < nextTokenCount);
                    });
                  }}
                  onToggleProperNoun={(index) =>
                    setProperNounIndices((indices) =>
                      indices.includes(index)
                        ? indices.filter((item) => item !== index)
                        : [...indices, index].sort((a, b) => a - b),
                    )
                  }
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
                  wordPrompt={wordPrompt}
                  wordHint={wordHint}
                  wordWords={wordTokenData.words}
                  scPrompt={scPrompt}
                  scKoreanHint={scKoreanHint}
                  scGivenWordsRaw={scGivenWordsRaw}
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

function WordArrangementEditor({
  hint,
  answerSentence,
  rawTokens,
  words,
  properNounIndices,
  onHintChange,
  onAnswerSentenceChange,
  onToggleProperNoun,
}: {
  hint: string;
  answerSentence: string;
  rawTokens: string[];
  words: string[];
  properNounIndices: number[];
  onHintChange: (value: string) => void;
  onAnswerSentenceChange: (value: string) => void;
  onToggleProperNoun: (index: number) => void;
}) {
  return (
    <div className="mt-4 grid gap-4">
      <label className="block">
        <span className="text-sm font-semibold text-body-on-dark">
          한국어 힌트
        </span>
        <textarea
          className="field-on-dark mt-2 min-h-20 resize-y"
          value={hint}
          onChange={(event) => onHintChange(event.target.value)}
          placeholder="그는 서울에 갈 수 없다."
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-body-on-dark">
          정답 문장
        </span>
        <input
          className="field-on-dark mt-2"
          value={answerSentence}
          onChange={(event) => onAnswerSentenceChange(event.target.value)}
          placeholder="John can't go to Seoul."
        />
      </label>

      <div className="rounded-lg border border-hairline-on-dark bg-canvas-dark p-3">
        <p className="text-xs font-semibold text-muted">Token Preview</p>
        <div className="mt-3 grid gap-2">
          {rawTokens.length === 0 ? (
            <p className="text-sm text-muted">정답 문장을 입력하세요.</p>
          ) : null}
          {rawTokens.map((token, index) => {
            const isProperNoun = properNounIndices.includes(index);

            return (
              <label
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-hairline-on-dark bg-surface-card-dark px-3 py-2"
                key={`${token}-${index}`}
              >
                <span className="inline-flex min-h-8 items-center rounded-pill border border-primary/40 px-3 text-sm font-semibold text-body-on-dark">
                  {token}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted">
                  <input
                    className="h-4 w-4 accent-primary"
                    type="checkbox"
                    checked={isProperNoun}
                    onChange={() => onToggleProperNoun(index)}
                  />
                  고유명사
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-hairline-on-dark bg-canvas-dark p-3">
        <p className="text-xs font-semibold text-muted">Word Bank Preview</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {words.map((word, index) => (
            <span
              className="inline-flex min-h-8 items-center rounded-pill border border-hairline-on-dark bg-surface-card-dark px-3 text-sm font-semibold text-body-on-dark"
              key={`${word}-${index}`}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SentenceConstructionEditor({
  koreanHint,
  givenWordsRaw,
  answer,
  acceptableAnswersRaw,
  onKoreanHintChange,
  onGivenWordsRawChange,
  onAnswerChange,
  onAcceptableAnswersRawChange,
}: {
  koreanHint: string;
  givenWordsRaw: string;
  answer: string;
  acceptableAnswersRaw: string;
  onKoreanHintChange: (value: string) => void;
  onGivenWordsRawChange: (value: string) => void;
  onAnswerChange: (value: string) => void;
  onAcceptableAnswersRawChange: (value: string) => void;
}) {
  const parsedWords = parseGivenWords(givenWordsRaw);

  return (
    <div className="mt-4 grid gap-4">
      <label className="block">
        <span className="text-sm font-semibold text-body-on-dark">
          한국어 힌트
        </span>
        <textarea
          className="field-on-dark mt-2 min-h-20 resize-y"
          value={koreanHint}
          onChange={(event) => onKoreanHintChange(event.target.value)}
          placeholder="나는 어제 도서관에 갔다."
        />
      </label>

      <div>
        <label className="block">
          <span className="text-sm font-semibold text-body-on-dark">
            주어진 단어
          </span>
          <input
            className="field-on-dark mt-2"
            value={givenWordsRaw}
            onChange={(event) => onGivenWordsRawChange(event.target.value)}
            placeholder="I / go / library / yesterday"
          />
        </label>
        <p className="mt-1.5 text-xs leading-5 text-muted">
          슬래시(/), 쉼표(,), 줄바꿈으로 구분합니다.
        </p>
        {parsedWords.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {parsedWords.map((word, index) => (
              <span
                className="inline-flex min-h-7 items-center rounded-pill border border-hairline-on-dark bg-canvas-dark px-2.5 text-xs font-semibold text-body-on-dark"
                key={`${word}-${index}`}
              >
                {word}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-body-on-dark">정답</span>
        <input
          className="field-on-dark mt-2"
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          placeholder="I went to the library yesterday."
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-body-on-dark">
          허용 정답{" "}
          <span className="font-normal text-muted">(optional)</span>
        </span>
        <textarea
          className="field-on-dark mt-2 min-h-20 resize-y"
          value={acceptableAnswersRaw}
          onChange={(event) => onAcceptableAnswersRawChange(event.target.value)}
          placeholder={"Yesterday I went to the library.\nI went to the library."}
        />
        <p className="mt-1.5 text-xs leading-5 text-muted">
          줄바꿈으로 구분합니다. 대소문자와 끝 문장부호는 자동으로 무시합니다.
        </p>
      </label>
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
  wordPrompt,
  wordHint,
  wordWords,
  scPrompt,
  scKoreanHint,
  scGivenWordsRaw,
}: {
  questionType: QuestionType;
  multiplePrompt: string;
  multipleChoices: string[];
  multipleAnswer: number;
  binaryPrompt: string;
  binaryChoices: [string, string];
  binaryAnswer: number;
  wordPrompt: string;
  wordHint: string;
  wordWords: string[];
  scPrompt: string;
  scKoreanHint: string;
  scGivenWordsRaw: string;
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

  if (questionType === "word_arrangement") {
    return (
      <div className="mt-3 rounded-lg border border-hairline-on-dark bg-canvas-dark p-4">
        <p className="text-sm font-semibold leading-6 text-body-on-dark">
          {wordPrompt || "주어진 단어를 배열해 문장을 완성하세요."}
        </p>
        {wordHint ? (
          <p className="mt-2 text-sm leading-6 text-muted">{wordHint}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {wordWords.map((word, index) => (
            <span
              className="inline-flex min-h-9 items-center rounded-pill border border-hairline-on-dark px-3 text-sm font-semibold text-body-on-dark"
              key={`${word}-${index}`}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (questionType === "sentence_construction") {
    const parsedWords = parseGivenWords(scGivenWordsRaw);

    return (
      <div className="mt-3 rounded-lg border border-hairline-on-dark bg-canvas-dark p-4">
        <p className="text-sm font-semibold leading-6 text-body-on-dark">
          {scPrompt ||
            "주어진 단어를 활용하고 필요한 표현을 추가해 문장을 완성하세요."}
        </p>
        {scKoreanHint ? (
          <p className="mt-2 text-sm leading-6 text-muted">{scKoreanHint}</p>
        ) : null}
        {parsedWords.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {parsedWords.map((word, index) => (
              <span
                className="inline-flex min-h-8 items-center rounded-pill border border-hairline-on-dark bg-surface-card-dark px-3 text-sm font-semibold text-body-on-dark"
                key={`${word}-${index}`}
              >
                {word}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-3 min-h-12 rounded-lg border border-hairline-on-dark bg-surface-card-dark p-3">
          <p className="text-sm text-muted">영어 문장을 입력하세요.</p>
        </div>
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
