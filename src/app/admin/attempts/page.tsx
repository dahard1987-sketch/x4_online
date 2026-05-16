"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Attempt } from "@/types/attempt";

type AttemptListItem = Attempt & {
  id: string;
};

type CompletionFilter = "all" | "completed" | "incomplete";
type ScoreFilter = "all" | "first100" | "under80" | "under60";

function formatTimestamp(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toLocaleString("ko-KR");
  }

  if (value instanceof Date) {
    return value.toLocaleString("ko-KR");
  }

  return "-";
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "-";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}초`;
  }

  return `${minutes}분 ${remainingSeconds}초`;
}

function getScoreBadgeClass(score: number) {
  if (score === 100) {
    return "bg-primary text-on-primary";
  }

  if (score < 60) {
    return "bg-incorrect text-on-primary";
  }

  return "bg-surface-elevated-dark text-body-on-dark";
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length,
  );
}

export default function AdminAttemptsPage() {
  const [attempts, setAttempts] = useState<AttemptListItem[]>([]);
  const [expandedAttemptId, setExpandedAttemptId] = useState("");
  const [studentEmailQuery, setStudentEmailQuery] = useState("");
  const [activityTitleQuery, setActivityTitleQuery] = useState("");
  const [completionFilter, setCompletionFilter] =
    useState<CompletionFilter>("all");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadAttempts() {
      try {
        const snapshot = await getDocs(
          query(collection(db, "attempts"), orderBy("createdAt", "desc")),
        );

        setAttempts(
          snapshot.docs.map((attemptDoc) => ({
            id: attemptDoc.id,
            ...(attemptDoc.data() as Attempt),
          })),
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? `학습 결과를 불러오지 못했습니다: ${error.message}`
            : "학습 결과를 불러오는 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadAttempts();
  }, []);

  const filteredAttempts = useMemo(() => {
    const studentEmailSearch = studentEmailQuery.trim().toLowerCase();
    const activityTitleSearch = activityTitleQuery.trim().toLowerCase();

    return attempts.filter((attempt) => {
      const studentEmail = (attempt.studentEmail || "").toLowerCase();
      const activityTitle = attempt.activityTitle.toLowerCase();

      if (studentEmailSearch && !studentEmail.includes(studentEmailSearch)) {
        return false;
      }

      if (activityTitleSearch && !activityTitle.includes(activityTitleSearch)) {
        return false;
      }

      if (completionFilter === "completed" && !attempt.completed) {
        return false;
      }

      if (completionFilter === "incomplete" && attempt.completed) {
        return false;
      }

      if (scoreFilter === "first100" && attempt.firstRoundScore !== 100) {
        return false;
      }

      if (scoreFilter === "under80" && attempt.firstRoundScore >= 80) {
        return false;
      }

      if (scoreFilter === "under60" && attempt.firstRoundScore >= 60) {
        return false;
      }

      return true;
    });
  }, [
    activityTitleQuery,
    attempts,
    completionFilter,
    scoreFilter,
    studentEmailQuery,
  ]);

  const summary = useMemo(() => {
    const completedAttempts = attempts.filter((attempt) => attempt.completed);
    const uniqueStudentCount = new Set(
      attempts.map((attempt) => attempt.studentId),
    ).size;
    const averageFirstScore = average(
      attempts.map((attempt) => attempt.firstRoundScore),
    );
    const averageFullRounds = average(
      attempts.map((attempt) => attempt.totalFullRounds),
    );

    return {
      completedCount: completedAttempts.length,
      uniqueStudentCount,
      averageFirstScore,
      averageFullRounds,
    };
  }, [attempts]);

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
            <Link className="button-secondary-on-dark" href="/dashboard">
              대시보드
            </Link>
            <Link
              className="button-secondary-on-dark"
              href="/admin/questions/new"
            >
              문항 만들기
            </Link>
            <Link className="button-secondary-on-dark" href="/admin/questions">
              문항 목록
            </Link>
            <Link
              className="button-secondary-on-dark"
              href="/admin/activities/new"
            >
              활동 만들기
            </Link>
            <Link className="button-secondary-on-dark" href="/admin/activities">
              활동 목록
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-page px-5 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-primary">Attempts</p>
          <h1 className="mt-3 text-3xl font-bold text-body-on-dark sm:text-display-lg">
            학습 결과
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            학생들이 완료한 활동 결과와 첫 점수, 최고점, 반복 횟수를
            확인합니다.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="전체 완료 기록 수" value={summary.completedCount} />
          <SummaryCard label="고유 학생 수" value={summary.uniqueStudentCount} />
          <SummaryCard
            label="평균 첫 점수"
            value={
              summary.averageFirstScore === null
                ? "기록 없음"
                : `${summary.averageFirstScore}점`
            }
          />
          <SummaryCard
            label="평균 전체 풀이 횟수"
            value={
              summary.averageFullRounds === null
                ? "기록 없음"
                : `${summary.averageFullRounds}회`
            }
          />
        </div>

        <section className="mt-8 rounded-xl border border-hairline-on-dark bg-surface-card-dark p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_160px_180px]">
            <label className="block">
              <span className="text-xs font-semibold text-muted">
                학생 이메일
              </span>
              <input
                className="field-on-dark mt-2"
                value={studentEmailQuery}
                onChange={(event) => setStudentEmailQuery(event.target.value)}
                placeholder="student@example.com"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted">활동명</span>
              <input
                className="field-on-dark mt-2"
                value={activityTitleQuery}
                onChange={(event) => setActivityTitleQuery(event.target.value)}
                placeholder="X4 문법 훈련"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted">
                완료 여부
              </span>
              <select
                className="field-on-dark mt-2"
                value={completionFilter}
                onChange={(event) =>
                  setCompletionFilter(event.target.value as CompletionFilter)
                }
              >
                <option value="all">전체</option>
                <option value="completed">완료</option>
                <option value="incomplete">미완료</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted">
                점수 범위
              </span>
              <select
                className="field-on-dark mt-2"
                value={scoreFilter}
                onChange={(event) =>
                  setScoreFilter(event.target.value as ScoreFilter)
                }
              >
                <option value="all">전체</option>
                <option value="first100">첫 점수 100점</option>
                <option value="under80">첫 점수 80점 미만</option>
                <option value="under60">첫 점수 60점 미만</option>
              </select>
            </label>
          </div>
        </section>

        {isLoading ? (
          <p className="mt-8 rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6 text-sm text-muted">
            학습 결과를 불러오고 있습니다.
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-8 rounded-xl border border-incorrect bg-surface-card-dark p-6 text-sm text-body-on-dark">
            {errorMessage}
          </p>
        ) : null}

        {!isLoading && !errorMessage && filteredAttempts.length === 0 ? (
          <p className="mt-8 rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6 text-sm text-muted">
            표시할 학습 결과가 없습니다.
          </p>
        ) : null}

        {!isLoading && !errorMessage && filteredAttempts.length > 0 ? (
          <div className="mt-8 overflow-x-auto rounded-xl border border-hairline-on-dark bg-surface-card-dark">
            <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
              <thead className="border-b border-hairline-on-dark bg-canvas-dark text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">학생 이메일</th>
                  <th className="px-4 py-3 font-semibold">활동명</th>
                  <th className="px-4 py-3 font-semibold">완료</th>
                  <th className="px-4 py-3 font-semibold">첫 점수</th>
                  <th className="px-4 py-3 font-semibold">최고점</th>
                  <th className="px-4 py-3 font-semibold">최종</th>
                  <th className="px-4 py-3 font-semibold">전체</th>
                  <th className="px-4 py-3 font-semibold">복습</th>
                  <th className="px-4 py-3 font-semibold">소요</th>
                  <th className="px-4 py-3 font-semibold">완료 시각</th>
                  <th className="px-4 py-3 font-semibold">상세</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map((attempt) => (
                  <AttemptRow
                    attempt={attempt}
                    isExpanded={expandedAttemptId === attempt.id}
                    key={attempt.id}
                    onToggle={() =>
                      setExpandedAttemptId((currentId) =>
                        currentId === attempt.id ? "" : attempt.id,
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-5">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-3 text-2xl font-bold text-body-on-dark">{value}</p>
    </article>
  );
}

function AttemptRow({
  attempt,
  isExpanded,
  onToggle,
}: {
  attempt: AttemptListItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-b border-hairline-on-dark align-top">
        <td className="px-4 py-4 text-body-on-dark">
          {attempt.studentEmail || "-"}
        </td>
        <td className="px-4 py-4 text-body-on-dark">{attempt.activityTitle}</td>
        <td className="px-4 py-4">
          <span
            className={`rounded-sm border px-2 py-1 text-xs font-semibold ${
              attempt.completed
                ? "border-correct/40 text-correct"
                : "border-hairline-on-dark text-muted"
            }`}
          >
            {attempt.completed ? "완료" : "미완료"}
          </span>
        </td>
        <td className="px-4 py-4">
          <ScoreBadge score={attempt.firstRoundScore} />
        </td>
        <td className="px-4 py-4">
          <ScoreBadge score={attempt.bestScore} />
        </td>
        <td className="px-4 py-4">
          <ScoreBadge score={attempt.finalScore} />
        </td>
        <td className="px-4 py-4 text-body-on-dark">
          {attempt.totalFullRounds}
        </td>
        <td className="px-4 py-4 text-body-on-dark">
          {attempt.totalReviewRounds}
        </td>
        <td className="px-4 py-4 text-muted">
          {formatDuration(attempt.durationSec)}
        </td>
        <td className="px-4 py-4 text-muted">
          {formatTimestamp(attempt.finishedAt || attempt.createdAt)}
        </td>
        <td className="px-4 py-4">
          <button
            className="button-secondary-on-dark min-h-8 px-3 py-2 text-xs"
            type="button"
            onClick={onToggle}
          >
            {isExpanded ? "닫기" : "상세"}
          </button>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="border-b border-hairline-on-dark bg-canvas-dark">
          <td className="px-4 py-5" colSpan={11}>
            <AttemptDetailPanel attempt={attempt} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-md px-3 text-xs font-semibold ${getScoreBadgeClass(
        score,
      )}`}
    >
      {score}점
    </span>
  );
}

function AttemptDetailPanel({ attempt }: { attempt: AttemptListItem }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section>
        <p className="text-sm font-semibold text-primary">Attempt</p>
        <dl className="mt-3 grid gap-2 text-sm">
          <DetailLine label="attempt id" value={attempt.id} />
          <DetailLine label="studentId" value={attempt.studentId} />
          <DetailLine label="activityId" value={attempt.activityId} />
          <DetailLine label="attemptNumber" value={attempt.attemptNumber} />
        </dl>

        <p className="mt-6 text-sm font-semibold text-primary">
          roundSummaries
        </p>
        <div className="mt-3 grid gap-2">
          {attempt.roundSummaries.map((summary, index) => (
            <div
              className="rounded-lg border border-hairline-on-dark bg-surface-card-dark p-3 text-xs"
              key={`${attempt.id}-round-${index}`}
            >
              <p className="font-semibold text-body-on-dark">
                {summary.mode} #{summary.roundNumber}
              </p>
              <p className="mt-2 text-muted">
                questions {summary.questionCount} · correct{" "}
                {summary.correctCount} · score{" "}
                {summary.score === null ? "-" : summary.score}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold text-primary">details</p>
        <div className="mt-3 grid gap-2">
          {attempt.details.map((detail) => (
            <div
              className="rounded-lg border border-hairline-on-dark bg-surface-card-dark p-3 text-xs"
              key={`${attempt.id}-${detail.questionId}`}
            >
              <p className="font-semibold text-body-on-dark">
                {detail.questionId}
              </p>
              <p className="mt-2 leading-5 text-muted">
                attempts {detail.attemptsInActivity} · first{" "}
                {String(detail.firstAnsweredCorrect)} · final{" "}
                {String(detail.finalAnsweredCorrect)}
              </p>
              <p className="mt-1 leading-5 text-muted">
                firstWrongFullRound {detail.firstWrongFullRound ?? "-"} ·
                masteredAtFullRound {detail.masteredAtFullRound ?? "-"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DetailLine({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="grid gap-1 rounded-lg border border-hairline-on-dark bg-surface-card-dark p-3 sm:grid-cols-[140px_1fr]">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="break-all text-xs font-semibold text-body-on-dark">
        {value}
      </dd>
    </div>
  );
}
