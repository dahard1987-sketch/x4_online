"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
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

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
            ? error.message
            : "문항 목록을 불러오는 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, []);

  return (
    <main className="min-h-screen bg-canvas-dark text-body-on-dark">
      <header className="border-b border-hairline-on-dark bg-canvas-dark">
        <nav className="mx-auto flex min-h-16 max-w-page flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
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
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className="button-secondary-on-dark" href="/dashboard">
              대시보드로 돌아가기
            </Link>
            <Link
              className="button-secondary-on-dark"
              href="/admin/activities/new"
            >
              활동 만들기
            </Link>
            <Link className="button-secondary-on-dark" href="/admin/attempts">
              학습 결과
            </Link>
            <Link className="button-primary" href="/admin/questions/new">
              새 문항 만들기
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-page px-5 py-10 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Questions</p>
          <h1 className="mt-3 text-3xl font-bold text-body-on-dark sm:text-display-lg">
            문항 목록
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            Firestore `questions` 컬렉션에 저장된 문항을 최근 생성순으로
            표시합니다.
          </p>
        </div>

        {isLoading ? (
          <p className="mt-10 rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6 text-sm text-muted">
            문항 목록을 불러오고 있습니다.
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-10 rounded-xl border border-incorrect bg-surface-card-dark p-6 text-sm text-body-on-dark">
            {errorMessage}
          </p>
        ) : null}

        {!isLoading && !errorMessage && questions.length === 0 ? (
          <p className="mt-10 rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6 text-sm text-muted">
            아직 저장된 문항이 없습니다.
          </p>
        ) : null}

        <div className="mt-10 grid gap-4">
          {questions.map((question) => (
            <article
              className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-5 sm:p-6"
              key={question.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm border border-primary/40 px-2 py-1 text-xs font-semibold text-primary">
                  {getTypeLabel(question.type)}
                </span>
                <span className="font-mono text-xs text-muted">
                  {question.id.slice(0, 8)}…
                </span>
              </div>

              <h2 className="mt-3 text-base font-semibold leading-snug text-body-on-dark">
                {question.prompt}
              </h2>

              {question.type === "word_arrangement" ? (
                <div className="mt-4">
                  {question.hint ? (
                    <p className="mb-3 text-sm leading-6 text-muted">
                      {question.hint}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-1.5">
                    {question.words.map((word, index) => (
                      <span
                        className="rounded-pill border border-hairline-on-dark px-2 py-1 text-xs text-body-on-dark"
                        key={`${question.id}-word-${index}`}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-body-on-dark">
                    {question.answer.join(" ")}
                  </p>
                </div>
              ) : question.type === "sentence_construction" ? (
                <div className="mt-4">
                  {question.koreanHint ? (
                    <p className="mb-3 text-sm leading-6 text-muted">
                      {question.koreanHint}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-1.5">
                    {question.givenWords.map((word, index) => (
                      <span
                        className="rounded-pill border border-hairline-on-dark px-2 py-1 text-xs text-body-on-dark"
                        key={`${question.id}-gw-${index}`}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-body-on-dark">
                    {question.answer}
                  </p>
                </div>
              ) : question.type === "word_form" ? (
                <div className="mt-4">
                  {question.hint ? (
                    <p className="mb-3 text-sm leading-6 text-muted">
                      {question.hint}
                    </p>
                  ) : null}
                  <p className="text-sm leading-7 text-body-on-dark">
                    {question.sentence.replace("{{blank}}", "[___]")}{" "}
                    <span className="font-semibold text-primary">
                      ({question.baseWord})
                    </span>
                  </p>
                  <p className="mt-3 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-body-on-dark">
                    {question.answer}
                  </p>
                </div>
              ) : question.type === "underline_judgment" ? (
                <div className="mt-4">
                  {(() => {
                    const parts = question.sentence.split(
                      /\{\{ul\}\}|\{\{\/ul\}\}/,
                    );
                    const before = parts[0] ?? "";
                    const underlined = parts[1] ?? "";
                    const after = parts[2] ?? "";
                    return (
                      <p className="text-sm leading-7 text-body-on-dark">
                        {before}
                        <span className="underline decoration-2">
                          {underlined}
                        </span>
                        {after}
                      </p>
                    );
                  })()}
                  <div className="mt-3 flex items-center gap-3">
                    <span
                      className={`rounded-md border px-3 py-1.5 text-sm font-bold ${
                        question.isCorrect
                          ? "border-correct/40 bg-correct/10 text-correct"
                          : "border-incorrect/40 bg-incorrect/10 text-incorrect"
                      }`}
                    >
                      {question.isCorrect ? "O" : "X"}
                    </span>
                    {!question.isCorrect && question.correction ? (
                      <p className="text-sm text-muted">
                        →{" "}
                        <span className="font-semibold text-body-on-dark">
                          {question.correction}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {question.choices.map((choice, index) => (
                    <li
                      className={`rounded-md border px-3 py-2 text-sm ${
                        question.answer === index
                          ? "border-primary bg-primary/15 font-semibold text-body-on-dark"
                          : "border-hairline-on-dark text-muted"
                      }`}
                      key={`${question.id}-${index}`}
                    >
                      {choice}
                    </li>
                  ))}
                </ul>
              )}

              {question.explanation ? (
                <p className="mt-4 border-t border-hairline-on-dark pt-4 text-sm leading-6 text-muted">
                  {question.explanation}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
