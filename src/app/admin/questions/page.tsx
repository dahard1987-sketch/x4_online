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
  if (type === "underline_judgment") return "밑줄 판단";
  if (type === "sentence_parsing") return "성분 분석";
  return type;
}

function getAnswerPreview(question: QuestionListItem): string {
  if (question.type === "multiple_choice" || question.type === "binary_choice") {
    return question.choices[question.answer] ?? "";
  }
  if (question.type === "word_arrangement") {
    return question.answer.join(" ");
  }
  if (
    question.type === "sentence_construction" ||
    question.type === "word_form"
  ) {
    return question.answer;
  }
  if (question.type === "underline_judgment") {
    return question.isCorrect ? "O" : `X → ${question.correction ?? ""}`;
  }
  if (question.type === "sentence_parsing") {
    return question.targets.length + "개 성분";
  }
  return "";
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
              대시보드
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

      <section className="mx-auto max-w-page px-5 py-8 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Questions</p>
            <h1 className="mt-2 text-2xl font-bold text-body-on-dark">
              문항 목록
            </h1>
          </div>
          <span className="text-sm text-muted">{questions.length}개</span>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted">불러오는 중...</p>
        ) : null}

        {errorMessage ? (
          <p className="mt-6 rounded-xl border border-incorrect bg-surface-card-dark p-5 text-sm text-body-on-dark">
            {errorMessage}
          </p>
        ) : null}

        {!isLoading && !errorMessage && questions.length === 0 ? (
          <p className="mt-6 text-sm text-muted">아직 저장된 문항이 없습니다.</p>
        ) : null}

        <div className="mt-5 rounded-xl border border-hairline-on-dark bg-surface-card-dark">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={`flex items-start gap-3 px-4 py-3 ${
                index !== questions.length - 1
                  ? "border-b border-hairline-on-dark"
                  : ""
              }`}
            >
              <span className="mt-0.5 shrink-0 rounded-sm border border-primary/40 px-2 py-0.5 text-xs font-semibold text-primary">
                {getTypeLabel(question.type)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-body-on-dark">
                  {question.prompt}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {getAnswerPreview(question)}
                </p>
              </div>
              <span className="shrink-0 font-mono text-xs text-muted">
                {question.id.slice(0, 6)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
