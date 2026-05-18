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
import {
  getRoleLabel,
  normalizeTokenIndices,
  tokenizeSentenceForParsing,
} from "@/lib/sentenceParsing";
import type { SentenceParsingRole } from "@/lib/sentenceParsing";
import type { Question } from "@/types/question";

type QuestionType =
  | "multiple_choice"
  | "binary_choice"
  | "word_arrangement"
  | "sentence_construction"
  | "word_form"
  | "underline_judgment"
  | "sentence_parsing";

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
  prompt: "The bus ( ) at 7 a.m. every day.",
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

const wordFormDefaults = {
  prompt: "주어진 단어를 문맥에 맞게 알맞은 형태로 바꾸세요.",
  sentence: "I ___ to school yesterday.",
  baseWord: "go",
  hint: "과거형",
  answer: "went",
};

const underlineJudgmentDefaults = {
  prompt: "다음 문장에서 밑줄 친 부분의 어법이 올바른지 판단하세요.",
  sentence: "He [goed] to school yesterday.",
  isCorrect: false,
  correction: "went",
};

const sentenceParsingDefaults = {
  prompt: "문장에서 주어, 동사, 전치사구를 찾아 표시하세요.",
  sentence: "The car over there belongs to Mike.",
  targets: [
    { role: "subject" as SentenceParsingRole, tokenIndices: [0, 1, 2, 3] },
    { role: "verb" as SentenceParsingRole, tokenIndices: [4] },
    { role: "prepositional" as SentenceParsingRole, tokenIndices: [5, 6] },
  ],
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
  const [wfPrompt, setWfPrompt] = useState(wordFormDefaults.prompt);
  const [wfSentence, setWfSentence] = useState(wordFormDefaults.sentence);
  const [wfBaseWord, setWfBaseWord] = useState(wordFormDefaults.baseWord);
  const [wfHint, setWfHint] = useState(wordFormDefaults.hint);
  const [wfAnswer, setWfAnswer] = useState(wordFormDefaults.answer);
  const [wfAcceptableAnswersRaw, setWfAcceptableAnswersRaw] = useState("");
  const [ujPrompt, setUjPrompt] = useState(underlineJudgmentDefaults.prompt);
  const [ujSentence, setUjSentence] = useState(
    underlineJudgmentDefaults.sentence,
  );
  const [ujIsCorrect, setUjIsCorrect] = useState(
    underlineJudgmentDefaults.isCorrect,
  );
  const [ujCorrection, setUjCorrection] = useState(
    underlineJudgmentDefaults.correction,
  );
  const [spPrompt, setSpPrompt] = useState(sentenceParsingDefaults.prompt);
  const [spSentence, setSpSentence] = useState(
    sentenceParsingDefaults.sentence,
  );
  const [spTargets, setSpTargets] = useState<
    { role: SentenceParsingRole; tokenIndices: number[] }[]
  >(sentenceParsingDefaults.targets);
  const [spSelectedIndices, setSpSelectedIndices] = useState<number[]>([]);
  const [spSelectedRole, setSpSelectedRole] =
    useState<SentenceParsingRole>("subject");
  const [showPreview, setShowPreview] = useState(true);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savedQuestionId, setSavedQuestionId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const wordTokens = useMemo(
    () => tokenizeSentenceForWordArrangement(wordAnswerSentence),
    [wordAnswerSentence],
  );
  const spTokens = useMemo(
    () => tokenizeSentenceForParsing(spSentence),
    [spSentence],
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
          : questionType === "sentence_construction"
            ? scPrompt
            : questionType === "word_form"
              ? wfPrompt
              : questionType === "underline_judgment"
                ? ujPrompt
                : spPrompt;

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
        prompt: binaryPrompt.trim().replace(/\(\s*\)/g, "{{choice}}"),
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

    if (questionType === "word_form") {
      const parsedAcceptable = parseAcceptableAnswers(wfAcceptableAnswersRaw);
      return {
        type: "word_form",
        prompt: wfPrompt.trim(),
        sentence: wfSentence.trim().replace(/___/g, "{{blank}}"),
        baseWord: wfBaseWord.trim(),
        ...(wfHint.trim() ? { hint: wfHint.trim() } : {}),
        answer: wfAnswer.trim(),
        ...(parsedAcceptable.length > 0
          ? { acceptableAnswers: parsedAcceptable }
          : {}),
        ...optionalFields,
      };
    }

    if (questionType === "underline_judgment") {
      return {
        type: "underline_judgment",
        prompt: ujPrompt.trim(),
        sentence: ujSentence.trim().replace(/\[([^\]]+)\]/g, "{{ul}}$1{{/ul}}"),
        isCorrect: ujIsCorrect,
        ...(!ujIsCorrect && ujCorrection.trim()
          ? { correction: ujCorrection.trim() }
          : {}),
        ...optionalFields,
      };
    }

    if (questionType === "sentence_parsing") {
      return {
        type: "sentence_parsing",
        prompt: spPrompt.trim(),
        sentence: spSentence.trim(),
        tokens: spTokens.filter(Boolean),
        targets: spTargets.map((t) => ({
          role: t.role,
          tokenIndices: t.tokenIndices,
        })),
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
    wfAcceptableAnswersRaw,
    wfAnswer,
    wfBaseWord,
    wfHint,
    wfPrompt,
    wfSentence,
    wordHint,
    wordPrompt,
    wordTokenData,
    ujPrompt,
    ujSentence,
    ujIsCorrect,
    ujCorrection,
    spPrompt,
    spSentence,
    spTokens,
    spTargets,
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

    if (question.type === "word_form") {
      if (!question.sentence.trim()) {
        return "문장을 입력하세요.";
      }

      if (!question.sentence.includes("{{blank}}")) {
        return "문장에 ___를 반드시 포함시켜야 합니다.";
      }

      if (!question.baseWord.trim()) {
        return "원형 단어를 입력하세요.";
      }

      if (!question.answer.trim()) {
        return "정답을 입력하세요.";
      }

      return "";
    }

    if (question.type === "underline_judgment") {
      if (!question.sentence.trim()) {
        return "문장을 입력하세요.";
      }

      if (
        !question.sentence.includes("{{ul}}") ||
        !question.sentence.includes("{{/ul}}")
      ) {
        return "문장에 [밑줄 부분] 형식으로 밑줄 구간을 표시해야 합니다.";
      }

      if (!question.isCorrect && !question.correction?.trim()) {
        return "어법이 틀린 경우 올바른 표현(correction)을 입력하세요.";
      }

      return "";
    }

    if (question.type === "binary_choice") {
      if (!question.prompt.includes("{{choice}}")) {
        return "이항대립 문항 본문에 반드시 ( )를 포함시켜야 합니다.";
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

    if (question.type === "sentence_parsing") {
      if (!question.sentence.trim()) {
        return "분석 대상 문장을 입력하세요.";
      }

      if (question.tokens.length === 0) {
        return "토큰이 1개 이상 필요합니다.";
      }

      if (question.targets.length === 0) {
        return "정답 그룹을 1개 이상 추가하세요.";
      }

      for (const target of question.targets) {
        if (target.tokenIndices.length === 0) {
          return "각 정답 그룹에 토큰이 1개 이상 선택되어야 합니다.";
        }

        if (
          target.tokenIndices.some(
            (i) => i < 0 || i >= question.tokens.length,
          )
        ) {
          return "토큰 인덱스가 유효한 범위를 벗어났습니다.";
        }
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
              <option value="word_form">단어 변형</option>
              <option value="underline_judgment">밑줄 어법 판단</option>
              <option value="sentence_parsing">문장 성분 분석</option>
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
                  if (questionType === "sentence_construction") {
                    setScPrompt(event.target.value);
                    return;
                  }
                  if (questionType === "word_form") {
                    setWfPrompt(event.target.value);
                    return;
                  }
                  if (questionType === "sentence_parsing") {
                    setSpPrompt(event.target.value);
                    return;
                  }
                  setUjPrompt(event.target.value);
                }}
                placeholder={
                  questionType === "multiple_choice"
                    ? "다음 중 어법상 올바른 문장을 선택하세요."
                    : questionType === "binary_choice"
                      ? "The bus {{choice}} at 7 a.m. every day."
                      : questionType === "word_arrangement"
                        ? "주어진 단어를 배열해 문장을 완성하세요."
                        : questionType === "sentence_construction"
                          ? "주어진 단어를 활용하고 필요한 표현을 추가해 문장을 완성하세요."
                          : questionType === "word_form"
                            ? "주어진 단어를 문맥에 맞게 알맞은 형태로 바꾸세요."
                            : questionType === "sentence_parsing"
                              ? "문장에서 주어, 동사, 전치사구를 찾아 표시하세요."
                              : "다음 문장에서 밑줄 친 부분의 어법이 올바른지 판단하세요."
                }
              />
            </label>

            {questionType === "binary_choice" ? (
              <p className="mt-2 text-xs leading-5 text-muted">
                선택지가 들어갈 위치에 ( )를 넣으세요. 예: The bus ( ) at 7 a.m.
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

            {questionType === "word_form" ? (
              <p className="mt-2 text-xs leading-5 text-muted">
                빈칸 위치에 ___를 넣으세요. 예: I ___ to school yesterday.
              </p>
            ) : null}

            {questionType === "underline_judgment" ? (
              <p className="mt-2 text-xs leading-5 text-muted">
                밑줄 구간을 대괄호로 감싸세요. 예: He [goed] to school yesterday.
              </p>
            ) : null}

            {questionType === "sentence_parsing" ? (
              <p className="mt-2 text-xs leading-5 text-muted">
                학생에게 보여줄 안내문입니다. 아래 문장과 정답 그룹 입력은
                02 섹션에서 합니다.
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
              ) : questionType === "word_form" ? (
                <WordFormEditor
                  sentence={wfSentence}
                  baseWord={wfBaseWord}
                  hint={wfHint}
                  answer={wfAnswer}
                  acceptableAnswersRaw={wfAcceptableAnswersRaw}
                  onSentenceChange={setWfSentence}
                  onBaseWordChange={setWfBaseWord}
                  onHintChange={setWfHint}
                  onAnswerChange={setWfAnswer}
                  onAcceptableAnswersRawChange={setWfAcceptableAnswersRaw}
                />
              ) : questionType === "underline_judgment" ? (
                <UnderlineJudgmentEditor
                  sentence={ujSentence}
                  isCorrect={ujIsCorrect}
                  correction={ujCorrection}
                  onSentenceChange={setUjSentence}
                  onIsCorrectChange={setUjIsCorrect}
                  onCorrectionChange={setUjCorrection}
                />
              ) : questionType === "sentence_parsing" ? (
                <SentenceParsingEditor
                  sentence={spSentence}
                  tokens={spTokens}
                  targets={spTargets}
                  selectedIndices={spSelectedIndices}
                  selectedRole={spSelectedRole}
                  onSentenceChange={(value) => {
                    setSpSentence(value);
                    setSpSelectedIndices([]);
                    const newTokenCount =
                      tokenizeSentenceForParsing(value).length;
                    setSpTargets((prev) =>
                      prev
                        .map((t) => ({
                          ...t,
                          tokenIndices: t.tokenIndices.filter(
                            (i) => i < newTokenCount,
                          ),
                        }))
                        .filter((t) => t.tokenIndices.length > 0),
                    );
                  }}
                  onToggleIndex={(index) =>
                    setSpSelectedIndices((prev) =>
                      prev.includes(index)
                        ? prev.filter((i) => i !== index)
                        : [...prev, index],
                    )
                  }
                  onRoleChange={setSpSelectedRole}
                  onAddTarget={() => {
                    if (spSelectedIndices.length === 0) return;
                    const normalizedIndices =
                      normalizeTokenIndices(spSelectedIndices);
                    const isDuplicate = spTargets.some(
                      (t) =>
                        t.role === spSelectedRole &&
                        t.tokenIndices.length === normalizedIndices.length &&
                        t.tokenIndices.every(
                          (idx, i) => idx === normalizedIndices[i],
                        ),
                    );
                    if (!isDuplicate) {
                      setSpTargets((prev) => [
                        ...prev,
                        {
                          role: spSelectedRole,
                          tokenIndices: normalizedIndices,
                        },
                      ]);
                    }
                    setSpSelectedIndices([]);
                  }}
                  onRemoveTarget={(index) =>
                    setSpTargets((prev) => prev.filter((_, i) => i !== index))
                  }
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
                  wfPrompt={wfPrompt}
                  wfSentence={wfSentence}
                  wfBaseWord={wfBaseWord}
                  wfHint={wfHint}
                  ujPrompt={ujPrompt}
                  ujSentence={ujSentence}
                  ujIsCorrect={ujIsCorrect}
                  spPrompt={spPrompt}
                  spTokens={spTokens}
                  spTargets={spTargets}
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
  wfPrompt,
  wfSentence,
  wfBaseWord,
  wfHint,
  ujPrompt,
  ujSentence,
  ujIsCorrect,
  spPrompt,
  spTokens,
  spTargets,
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
  wfPrompt: string;
  wfSentence: string;
  wfBaseWord: string;
  wfHint: string;
  ujPrompt: string;
  ujSentence: string;
  ujIsCorrect: boolean;
  spPrompt: string;
  spTokens: string[];
  spTargets: { role: SentenceParsingRole; tokenIndices: number[] }[];
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

  if (questionType === "word_form") {
    const parts = wfSentence.split("___");
    const beforeBlank = parts[0] ?? "";
    const afterBlank = parts[1] ?? "";

    return (
      <div className="mt-3 rounded-lg border border-hairline-on-dark bg-canvas-dark p-4">
        <p className="text-sm font-semibold leading-6 text-body-on-dark">
          {wfPrompt || "주어진 단어를 문맥에 맞게 알맞은 형태로 바꾸세요."}
        </p>
        {wfHint ? (
          <p className="mt-2 text-sm leading-6 text-muted">{wfHint}</p>
        ) : null}
        <p className="mt-3 flex flex-wrap items-center gap-x-1 text-sm leading-8 text-body-on-dark">
          <span>{beforeBlank}</span>
          <span className="inline-flex min-h-8 items-center rounded-md border border-hairline-on-dark bg-surface-card-dark px-3 text-sm text-muted">
            ___
          </span>
          <span className="font-semibold text-primary">({wfBaseWord || "원형"})</span>
          <span>{afterBlank}</span>
        </p>
      </div>
    );
  }

  if (questionType === "underline_judgment") {
    const bracketOpen = ujSentence.indexOf("[");
    const bracketClose = ujSentence.indexOf("]");
    const before = bracketOpen >= 0 ? ujSentence.slice(0, bracketOpen) : ujSentence;
    const underlined = bracketOpen >= 0 && bracketClose > bracketOpen ? ujSentence.slice(bracketOpen + 1, bracketClose) : "";
    const after = bracketClose >= 0 ? ujSentence.slice(bracketClose + 1) : "";

    return (
      <div className="mt-3 rounded-lg border border-hairline-on-dark bg-canvas-dark p-4">
        <p className="text-sm font-semibold leading-6 text-body-on-dark">
          {ujPrompt ||
            "다음 문장에서 밑줄 친 부분의 어법이 올바른지 판단하세요."}
        </p>
        <p className="mt-3 text-sm leading-8 text-body-on-dark">
          <span>{before}</span>
          <span className="underline decoration-2">{underlined || "밑줄 부분"}</span>
          <span>{after}</span>
        </p>
        <div className="mt-3 flex gap-2">
          <span
            className={`inline-flex min-h-8 items-center rounded-md border px-4 text-sm font-bold ${
              ujIsCorrect
                ? "border-primary bg-primary text-on-primary"
                : "border-hairline-on-dark bg-surface-card-dark text-body-on-dark"
            }`}
          >
            O
          </span>
          <span
            className={`inline-flex min-h-8 items-center rounded-md border px-4 text-sm font-bold ${
              !ujIsCorrect
                ? "border-primary bg-primary text-on-primary"
                : "border-hairline-on-dark bg-surface-card-dark text-body-on-dark"
            }`}
          >
            X
          </span>
        </div>
      </div>
    );
  }

  if (questionType === "sentence_parsing") {
    return (
      <div className="mt-3 rounded-lg border border-hairline-on-dark bg-canvas-dark p-4">
        <p className="text-sm font-semibold leading-6 text-body-on-dark">
          {spPrompt || "문장 성분을 찾아 표시하세요."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {spTokens.length > 0 ? (
            spTokens.map((token, index) => (
              <span
                key={`sp-prev-token-${index}`}
                className="inline-flex items-center rounded-md border border-hairline-on-dark bg-surface-card-dark px-3 py-1.5 text-sm font-semibold text-body-on-dark"
              >
                {token}
              </span>
            ))
          ) : (
            <p className="text-xs text-muted">문장을 입력하면 토큰이 표시됩니다.</p>
          )}
        </div>
        {spTargets.length > 0 ? (
          <div className="mt-3 grid gap-1.5">
            <p className="text-xs text-muted">정답:</p>
            {spTargets.map((target, index) => (
              <div
                key={`sp-prev-target-${index}`}
                className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs"
              >
                <span className="font-semibold text-primary">
                  {getRoleLabel(target.role)}
                </span>
                <span className="text-body-on-dark">
                  {target.tokenIndices
                    .map((i) => spTokens[i] ?? "")
                    .join(" ")}
                </span>
              </div>
            ))}
          </div>
        ) : null}
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

function WordFormEditor({
  sentence,
  baseWord,
  hint,
  answer,
  acceptableAnswersRaw,
  onSentenceChange,
  onBaseWordChange,
  onHintChange,
  onAnswerChange,
  onAcceptableAnswersRawChange,
}: {
  sentence: string;
  baseWord: string;
  hint: string;
  answer: string;
  acceptableAnswersRaw: string;
  onSentenceChange: (value: string) => void;
  onBaseWordChange: (value: string) => void;
  onHintChange: (value: string) => void;
  onAnswerChange: (value: string) => void;
  onAcceptableAnswersRawChange: (value: string) => void;
}) {
  return (
    <div className="mt-4 grid gap-4">
      <label className="block">
        <span className="text-sm font-semibold text-body-on-dark">문장</span>
        <input
          className="field-on-dark mt-2"
          value={sentence}
          onChange={(event) => onSentenceChange(event.target.value)}
          placeholder="I ___ to school yesterday."
        />
        <p className="mt-1.5 text-xs leading-5 text-muted">
          빈칸 위치에 ___를 입력하세요.
        </p>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-semibold text-body-on-dark">원형 단어</span>
          <input
            className="field-on-dark mt-2"
            value={baseWord}
            onChange={(event) => onBaseWordChange(event.target.value)}
            placeholder="go"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-body-on-dark">
            힌트 <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            className="field-on-dark mt-2"
            value={hint}
            onChange={(event) => onHintChange(event.target.value)}
            placeholder="과거형"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-body-on-dark">정답</span>
        <input
          className="field-on-dark mt-2"
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          placeholder="went"
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
          placeholder={"gone\nwent there"}
        />
        <p className="mt-1.5 text-xs leading-5 text-muted">
          줄바꿈으로 구분합니다. 대소문자와 끝 문장부호는 자동으로 무시합니다.
        </p>
      </label>
    </div>
  );
}

function UnderlineJudgmentEditor({
  sentence,
  isCorrect,
  correction,
  onSentenceChange,
  onIsCorrectChange,
  onCorrectionChange,
}: {
  sentence: string;
  isCorrect: boolean;
  correction: string;
  onSentenceChange: (value: string) => void;
  onIsCorrectChange: (value: boolean) => void;
  onCorrectionChange: (value: string) => void;
}) {
  return (
    <div className="mt-4 grid gap-4">
      <label className="block">
        <span className="text-sm font-semibold text-body-on-dark">문장</span>
        <input
          className="field-on-dark mt-2"
          value={sentence}
          onChange={(event) => onSentenceChange(event.target.value)}
          placeholder="He [goed] to school yesterday."
        />
        <p className="mt-1.5 text-xs leading-5 text-muted">
          밑줄 구간을 대괄호로 감싸세요. 예: He [goed] to school.
        </p>
      </label>

      <div>
        <span className="text-sm font-semibold text-body-on-dark">
          어법 판단
        </span>
        <div className="mt-2 flex gap-2">
          {([true, false] as const).map((value) => (
            <button
              key={String(value)}
              className={`inline-flex min-h-10 min-w-16 items-center justify-center rounded-md border text-sm font-bold transition ${
                isCorrect === value
                  ? "border-primary bg-primary text-on-primary"
                  : "border-hairline-on-dark bg-canvas-dark text-muted hover:text-body-on-dark"
              }`}
              type="button"
              onClick={() => onIsCorrectChange(value)}
            >
              {value ? "O (올바름)" : "X (틀림)"}
            </button>
          ))}
        </div>
      </div>

      {!isCorrect ? (
        <label className="block">
          <span className="text-sm font-semibold text-body-on-dark">
            올바른 표현
          </span>
          <input
            className="field-on-dark mt-2"
            value={correction}
            onChange={(event) => onCorrectionChange(event.target.value)}
            placeholder="went"
          />
        </label>
      ) : null}
    </div>
  );
}

const SP_ROLES: { value: SentenceParsingRole; label: string }[] = [
  { value: "subject", label: "주어" },
  { value: "verb", label: "동사" },
  { value: "object", label: "목적어" },
  { value: "complement", label: "보어" },
  { value: "modifier", label: "수식어" },
  { value: "prepositional", label: "전치사구" },
];

function SentenceParsingEditor({
  sentence,
  tokens,
  targets,
  selectedIndices,
  selectedRole,
  onSentenceChange,
  onToggleIndex,
  onRoleChange,
  onAddTarget,
  onRemoveTarget,
}: {
  sentence: string;
  tokens: string[];
  targets: { role: SentenceParsingRole; tokenIndices: number[] }[];
  selectedIndices: number[];
  selectedRole: SentenceParsingRole;
  onSentenceChange: (value: string) => void;
  onToggleIndex: (index: number) => void;
  onRoleChange: (role: SentenceParsingRole) => void;
  onAddTarget: () => void;
  onRemoveTarget: (index: number) => void;
}) {
  const usedIndices = new Set(targets.flatMap((t) => t.tokenIndices));

  const selectedPreview =
    selectedIndices.length > 0
      ? selectedIndices
          .slice()
          .sort((a, b) => a - b)
          .map((i) => tokens[i] ?? "")
          .join(" ")
      : null;

  return (
    <div className="mt-4 grid gap-4">
      <label className="block">
        <span className="text-sm font-semibold text-body-on-dark">
          분석 대상 문장
        </span>
        <input
          className="field-on-dark mt-2"
          value={sentence}
          onChange={(e) => onSentenceChange(e.target.value)}
          placeholder="The car over there belongs to Mike."
        />
        <p className="mt-1.5 text-xs leading-5 text-muted">
          입력 후 아래 토큰을 클릭해 성분을 지정하세요. 끝 마침표는 자동으로
          제거됩니다.
        </p>
      </label>

      {tokens.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-body-on-dark">토큰 선택</p>
          <p className="mt-1 text-xs text-muted">
            클릭해 선택하고 아래에서 성분을 지정하세요. 복수 선택 가능합니다.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tokens.map((token, index) => {
              const isSelected = selectedIndices.includes(index);
              const isUsed = usedIndices.has(index);
              return (
                <button
                  key={`sp-edit-token-${index}`}
                  type="button"
                  onClick={() => onToggleIndex(index)}
                  className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-semibold transition ${
                    isSelected
                      ? "border-primary bg-primary text-on-primary"
                      : isUsed
                        ? "border-correct/50 bg-correct/10 text-body-on-dark"
                        : "border-hairline-on-dark bg-canvas-dark text-body-on-dark hover:border-primary/40"
                  }`}
                >
                  {token}
                  <span className="ml-1 text-xs opacity-50">{index}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted">
          문장을 입력하면 토큰이 자동 생성됩니다.
        </p>
      )}

      <div>
        <p className="text-sm font-semibold text-body-on-dark">성분 선택</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SP_ROLES.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => onRoleChange(role.value)}
              className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-semibold transition ${
                selectedRole === role.value
                  ? "border-primary bg-primary text-on-primary"
                  : "border-hairline-on-dark bg-canvas-dark text-muted hover:text-body-on-dark"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onAddTarget}
          disabled={selectedIndices.length === 0}
          className="mt-3 inline-flex items-center rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-40"
        >
          {selectedPreview
            ? `"${selectedPreview}" → ${getRoleLabel(selectedRole)} 추가`
            : "토큰을 선택하세요"}
        </button>
      </div>

      {targets.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-body-on-dark">정답 그룹</p>
          <div className="mt-2 grid gap-2">
            {targets.map((target, index) => (
              <div
                key={`sp-target-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2"
              >
                <span className="text-sm text-body-on-dark">
                  <span className="font-semibold text-primary">
                    {getRoleLabel(target.role)}
                  </span>
                  {" — "}
                  {target.tokenIndices
                    .map((i) => tokens[i] ?? `[${i}]`)
                    .join(" ")}
                  <span className="ml-2 text-xs text-muted">
                    (인덱스: {target.tokenIndices.join(", ")})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveTarget(index)}
                  className="text-xs text-muted hover:text-incorrect"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
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
  const [beforeChoice, afterChoice] = prompt.includes("( )")
    ? prompt.split("( )")
    : prompt.includes("{{choice}}")
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
