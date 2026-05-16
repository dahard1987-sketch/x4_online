"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Activity } from "@/types/activity";

type ActivityListItem = Activity & {
  id: string;
};

function formatCreatedAt(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toLocaleDateString("ko-KR");
  }

  return "-";
}

function formatAssignedTo(assignedTo: Activity["assignedTo"]) {
  return assignedTo === "all" ? "전체 학생" : `${assignedTo.length}명`;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadActivities() {
      try {
        const snapshot = await getDocs(
          query(collection(db, "activities"), orderBy("date", "desc")),
        );

        setActivities(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Activity),
          })),
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? `활동 목록을 불러오지 못했습니다: ${error.message}`
            : "활동 목록을 불러오는 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadActivities();
  }, []);

  return (
    <main className="min-h-screen bg-canvas-dark text-body-on-dark">
      <header className="border-b border-hairline-on-dark bg-canvas-dark">
        <nav className="mx-auto flex min-h-16 max-w-page flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/canb-logo.png"
              alt="CANB English"
              width={1109}
              height={544}
              priority
              className="h-9 w-auto"
            />
            <span className="text-sm font-semibold text-muted">CANB Admin</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              className="button-secondary-on-dark"
              href="/admin/activities/new"
            >
              새 활동 만들기
            </Link>
            <Link className="button-secondary-on-dark" href="/admin/questions">
              문항 목록
            </Link>
            <Link className="button-secondary-on-dark" href="/dashboard">
              대시보드
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-page px-5 py-10 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Activities</p>
          <h1 className="mt-3 text-3xl font-bold text-body-on-dark sm:text-display-lg">
            활동 목록
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            Firestore activities 컬렉션에 저장된 활동을 날짜 내림차순으로
            표시합니다.
          </p>
        </div>

        {isLoading ? (
          <p className="mt-10 rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6 text-sm text-muted">
            활동 목록을 불러오고 있습니다.
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-10 rounded-xl border border-incorrect bg-surface-card-dark p-6 text-sm text-body-on-dark">
            {errorMessage}
          </p>
        ) : null}

        {!isLoading && !errorMessage && activities.length === 0 ? (
          <div className="mt-10 rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6">
            <p className="text-sm text-muted">아직 저장된 활동이 없습니다.</p>
            <Link
              className="button-primary mt-5"
              href="/admin/activities/new"
            >
              새 활동 만들기
            </Link>
          </div>
        ) : null}

        <div className="mt-10 grid gap-4">
          {activities.map((activity) => (
            <article
              className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-5 sm:p-6"
              key={activity.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {activity.date}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold leading-snug text-body-on-dark">
                    {activity.title}
                  </h2>
                </div>
                <span className="rounded-sm border border-hairline-on-dark bg-canvas-dark px-3 py-1.5 text-sm text-muted">
                  {activity.id}
                </span>
              </div>

              <dl className="mt-6 grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-hairline-on-dark bg-canvas-dark p-4">
                  <dt className="text-xs text-muted">문항 수</dt>
                  <dd className="mt-2 text-lg font-bold text-body-on-dark">
                    {activity.questionIds.length}개
                  </dd>
                </div>
                <div className="rounded-lg border border-hairline-on-dark bg-canvas-dark p-4">
                  <dt className="text-xs text-muted">배정 대상</dt>
                  <dd className="mt-2 text-lg font-bold text-body-on-dark">
                    {formatAssignedTo(activity.assignedTo)}
                  </dd>
                </div>
                <div className="rounded-lg border border-hairline-on-dark bg-canvas-dark p-4 sm:col-span-2">
                  <dt className="text-xs text-muted">생성일</dt>
                  <dd className="mt-2 text-lg font-bold text-body-on-dark">
                    {formatCreatedAt(activity.createdAt)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
