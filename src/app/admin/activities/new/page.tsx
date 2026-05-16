"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Activity } from "@/types/activity";
import type { Question } from "@/types/question";

type QuestionListItem = Question & {
  id: string;
};

function getTypeLabel(type: string) {
  if (type === "multiple_choice") return "객관식";
  if (type === "binary_choice") return "이항대립";
  if (type === "word_arrangement") return "단어 배열";
  if (type === "sentence_construction") return "문장 완성";
  if (type === "word_form") return "단어 변형";
  if (type === "underline_judgment") return "밑줄 어법 판단";
  return type;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewActivityPage() {
  const [title, setTitle] = useState("X4 문법 훈련 01");
  const [date, setDate] = useState(getTodayDate);
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [savedActivityId, setSavedActivityId] = useState("");

  const selectedQuestions = useMemo(
    () =>
      questions.filter((question) => selectedQuestionIds.includes(question.id)),
    [questions, selectedQuestionIds],
  );

  useEffect(() => {
    async function loadQuestions() {
      try {
        const snapshot = await getDocs(
          query(collection(db, "questions"), orderBy("createdAt", "desc")),
        );

        setQuestions(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Question),
          })),
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? `문항 목록을 불러오지 못했습니다: ${error.message}`
            : "문항 목록을 불러오는 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setIsLoadingQuestions(false);
      }
    }

    loadQuestions();
  }, []);

  function toggleQuestion(questionId: string) {
    setSelectedQuestionIds((currentIds) =>
      currentIds.includes(questionId)
        ? currentIds.filter((id) => id !== questionId)
        : [...currentIds, questionId],
    );
  }

  function validateActivity() {
    if (!title.trim()) {
      return "활동 제목을 입력하세요.";
    }

    if (!date) {
      return "활동 날짜를 선택하세요.";
    }

    if (selectedQuestionIds.length === 0) {
      return "활동에 포함할 문항을 1개 이상 선택하세요.";
    }

    return "";
  }

  async function handleSaveActivity() {
    setNotice("");
    setErrorMessage("");
    setSavedActivityId("");

    const validationError = validateActivity();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const activityData: Activity = {
      title: title.trim(),
      date,
      questionIds: selectedQuestionIds,
      assignedTo: "all",
    };

    setIsSaving(true);

    try {
      const docRef = await addDoc(collection(db, "activities"), {
        ...activityData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSavedActivityId(docRef.id);
      setNotice("활동이 저장되었습니다. 입력값은 유지됩니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `활동 저장에 실패했습니다: ${error.message}`
          : "활동 저장 중 알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas-dark text-body-on-dark">
      <header className="border-b border-hairline-on-dark bg-canvas-dark">
        <nav className="mx-auto flex min-h-16 max-w-page flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Image
                src="/canb-logo.png"
                alt="CANB English"
                width={1109}
                height={544}
                priority
                className="h-9 w-auto"
              />
            </Link>
            <span className="text-sm font-semibold text-muted">CANB Admin</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className="button-secondary-on-dark" href="/admin/questions">
              문항 목록
            </Link>
            <Link className="button-secondary-on-dark" href="/admin/activities">
              활동 목록
            </Link>
            <Link className="button-secondary-on-dark" href="/dashboard">
              대시보드
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-page px-5 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-hairline-on-dark pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Activities</p>
            <h1 className="mt-2 text-3xl font-bold text-body-on-dark">
              활동 만들기
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              저장된 문항을 선택해 특정 날짜의 전체 학생 활동으로 묶습니다.
            </p>
          </div>
          <button
            className="button-primary"
            type="button"
            onClick={handleSaveActivity}
            disabled={isSaving}
          >
            {isSaving ? "저장 중" : "활동 저장"}
          </button>
        </div>

        {(notice || savedActivityId || errorMessage) && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {notice ? (
              <span className="rounded-sm border border-correct/40 bg-surface-card-dark px-3 py-2 text-correct">
                {notice}
              </span>
            ) : null}
            {savedActivityId ? (
              <span className="rounded-sm border border-hairline-on-dark bg-surface-card-dark px-3 py-2 text-body-on-dark">
                activity id:{" "}
                <span className="font-semibold text-primary">
                  {savedActivityId}
                </span>
              </span>
            ) : null}
            {errorMessage ? (
              <span className="rounded-sm border border-incorrect bg-surface-card-dark px-3 py-2 text-body-on-dark">
                {errorMessage}
              </span>
            ) : null}
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-[380px_1fr]">
          <section className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-5">
            <p className="text-sm font-semibold text-primary">01 기본 정보</p>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-body-on-dark">
                제목
              </span>
              <input
                className="field-on-dark mt-2"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="X4 문법 훈련 01"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-body-on-dark">
                날짜
              </span>
              <input
                className="field-on-dark mt-2"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>

            <div className="mt-4 rounded-lg border border-hairline-on-dark bg-canvas-dark p-4">
              <p className="text-sm font-semibold text-body-on-dark">
                배정 대상
              </p>
              <p className="mt-2 text-sm text-muted">전체 학생</p>
              <p className="mt-3 text-xs leading-5 text-muted">
                이번 단계에서는 전체 학생 배정만 지원하며 Firestore에는
                <code className="mx-1 rounded-sm bg-surface-card-dark px-1 text-body-on-dark">
                  assignedTo: &quot;all&quot;
                </code>
                로 저장됩니다.
              </p>
            </div>

            <div className="mt-5 rounded-lg border border-primary/40 bg-canvas-dark p-4">
              <p className="text-sm font-semibold text-body-on-dark">
                선택된 문항
              </p>
              <p className="mt-2 text-2xl font-bold text-primary">
                {selectedQuestionIds.length}개
              </p>
              {selectedQuestions.length > 0 ? (
                <ul className="mt-3 grid gap-2 text-xs text-muted">
                  {selectedQuestions.slice(0, 4).map((question) => (
                    <li className="truncate" key={question.id}>
                      {question.prompt}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">
                  02 문항 선택
                </p>
                <p className="mt-2 text-sm text-muted">
                  activities 컬렉션에는 선택한 문항 ID만 저장됩니다.
                </p>
              </div>
              <span className="rounded-sm border border-hairline-on-dark bg-canvas-dark px-3 py-2 text-sm font-semibold text-body-on-dark">
                {selectedQuestionIds.length} / {questions.length}
              </span>
            </div>

            <div className="mt-5 max-h-[620px] overflow-y-auto pr-1">
              {isLoadingQuestions ? (
                <p className="rounded-lg border border-hairline-on-dark bg-canvas-dark p-5 text-sm text-muted">
                  문항 목록을 불러오고 있습니다.
                </p>
              ) : null}

              {!isLoadingQuestions && questions.length === 0 ? (
                <div className="rounded-lg border border-hairline-on-dark bg-canvas-dark p-5">
                  <p className="text-sm text-muted">
                    저장된 문항이 아직 없습니다.
                  </p>
                  <Link
                    className="button-secondary-on-dark mt-4"
                    href="/admin/questions/new"
                  >
                    새 문항 만들기
                  </Link>
                </div>
              ) : null}

              <div className="grid gap-3">
                {questions.map((question) => {
                  const isSelected = selectedQuestionIds.includes(question.id);

                  return (
                    <label
                      className={`block cursor-pointer rounded-lg border p-4 transition ${
                        isSelected
                          ? "border-primary bg-canvas-dark"
                          : "border-hairline-on-dark bg-canvas-dark hover:border-surface-elevated-dark"
                      }`}
                      key={question.id}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          className="mt-1 h-4 w-4 accent-primary"
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleQuestion(question.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-sm border border-primary/40 px-2 py-1 text-xs font-semibold text-primary">
                              {getTypeLabel(question.type)}
                            </span>
                            <span className="font-mono text-xs text-muted">
                              {question.id.slice(0, 8)}…
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-semibold leading-6 text-body-on-dark">
                            {question.prompt}
                          </p>
                          {question.type === "word_arrangement" ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {question.words.map((word, index) => (
                                <span
                                  className="rounded-pill border border-hairline-on-dark px-2 py-1 text-xs text-body-on-dark"
                                  key={`${question.id}-word-${index}`}
                                >
                                  {word}
                                </span>
                              ))}
                            </div>
                          ) : question.type === "sentence_construction" ? (
                            <div className="mt-3">
                              {question.koreanHint ? (
                                <p className="text-xs text-muted">
                                  {question.koreanHint}
                                </p>
                              ) : null}
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {question.givenWords.map((word, index) => (
                                  <span
                                    className="rounded-pill border border-hairline-on-dark px-2 py-1 text-xs text-body-on-dark"
                                    key={`${question.id}-gw-${index}`}
                                  >
                                    {word}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : question.type === "word_form" ? (
                            <p className="mt-3 text-xs leading-6 text-body-on-dark">
                              {question.sentence.replace("{{blank}}", "[___]")}{" "}
                              <span className="font-semibold text-primary">
                                ({question.baseWord})
                              </span>
                            </p>
                          ) : question.type === "underline_judgment" ? (
                            <p className="mt-3 text-xs leading-6 text-body-on-dark">
                              {question.sentence
                                .replace("{{ul}}", "【")
                                .replace("{{/ul}}", "】")}{" "}
                              <span
                                className={`font-semibold ${question.isCorrect ? "text-correct" : "text-incorrect"}`}
                              >
                                {question.isCorrect ? "O" : "X"}
                              </span>
                            </p>
                          ) : (
                            <>
                              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                {question.choices.map((choice, index) => (
                                  <li
                                    className={`rounded-md border px-3 py-2 text-xs ${
                                      question.answer === index
                                        ? "border-primary bg-primary/15 text-body-on-dark"
                                        : "border-hairline-on-dark text-muted"
                                    }`}
                                    key={`${question.id}-${index}`}
                                  >
                                    {index + 1}. {choice}
                                  </li>
                                ))}
                              </ul>
                              <p className="mt-3 text-xs text-muted">
                                정답 index:{" "}
                                <span className="font-semibold text-body-on-dark">
                                  {question.answer}
                                </span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
