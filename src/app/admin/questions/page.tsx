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
          <Image
            src="/canb-logo.png"
            alt="CANB English"
            width={1109}
            height={544}
            priority
            className="h-9 w-auto"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className="button-secondary-on-dark" href="/dashboard">
              대시보드로 돌아가기
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {question.type}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold leading-snug text-body-on-dark">
                    {question.prompt}
                  </h2>
                </div>
                <span className="rounded-sm border border-hairline-on-dark bg-canvas-dark px-3 py-1.5 text-sm text-muted">
                  {question.id}
                </span>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_120px]">
                <div>
                  <p className="text-sm font-semibold text-body-on-dark">
                    choices
                  </p>
                  <ul className="mt-3 grid gap-2">
                    {question.choices.map((choice, index) => (
                      <li
                        className="rounded-md border border-hairline-on-dark bg-canvas-dark px-3 py-2 text-sm text-body-on-dark"
                        key={`${question.id}-${index}`}
                      >
                        {index}. {choice}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold text-body-on-dark">
                    answer
                  </p>
                  <p className="mt-3 inline-flex min-h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
                    {question.answer}
                  </p>
                </div>
              </div>

              {question.explanation ? (
                <div className="mt-6 border-t border-hairline-on-dark pt-5">
                  <p className="text-sm font-semibold text-body-on-dark">
                    explanation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {question.explanation}
                  </p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
