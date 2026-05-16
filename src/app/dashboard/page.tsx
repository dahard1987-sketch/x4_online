"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type ActivityStatus = "not_started" | "in_progress" | "completed";

type Activity = {
  title: string;
  status: ActivityStatus;
  statusLabel: string;
  bestScore: number | null;
  actionLabel: string;
  href?: string;
};

const mockActivities: Activity[] = [
  {
    title: "X4 문법 훈련 01",
    status: "not_started",
    statusLabel: "미시작",
    bestScore: null,
    actionLabel: "시작하기",
    href: "/activity/mock-grammar-01",
  },
  {
    title: "X4 문법 훈련 02",
    status: "in_progress",
    statusLabel: "진행중",
    bestScore: 70,
    actionLabel: "이어하기",
  },
  {
    title: "X4 문법 훈련 03",
    status: "completed",
    statusLabel: "완료",
    bestScore: 100,
    actionLabel: "결과 보기",
  },
];

function getStatusClassName(status: ActivityStatus) {
  if (status === "completed") {
    return "border-correct/40 bg-canvas-dark text-correct";
  }

  if (status === "in_progress") {
    return "border-primary/40 bg-canvas-dark text-primary";
  }

  return "border-hairline-on-dark bg-canvas-dark text-muted";
}

function getScoreClassName(score: number | null) {
  if (score === 100) {
    return "bg-primary text-on-primary";
  }

  return "bg-surface-elevated-dark text-body-on-dark";
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);
      setIsCheckingAuth(false);
    });

    return unsubscribe;
  }, [router]);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut(auth);
    router.push("/login");
  }

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas-dark px-5 text-body-on-dark">
        <p className="text-sm text-muted">로그인 상태를 확인하고 있습니다.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas-dark text-body-on-dark">
      <header className="border-b border-hairline-on-dark bg-canvas-dark">
        <nav
          aria-label="학생 홈"
          className="mx-auto flex min-h-16 max-w-page flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"
        >
          <Image
            src="/canb-logo.png"
            alt="CANB English"
            width={1109}
            height={544}
            priority
            className="h-9 w-auto"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <p className="text-sm font-semibold text-body-on-dark">
              {user?.displayName || "학생 이름"}
            </p>
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
            <button
              className="button-secondary-on-dark"
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? "로그아웃 중" : "로그아웃"}
            </button>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-page px-5 py-12 sm:px-6 sm:py-section lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Student Home</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-body-on-dark sm:text-display-lg">
            오늘의 활동
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            오늘 배정된 문법 학습을 100점까지 완료하세요.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {mockActivities.map((activity) => (
            <article
              key={activity.title}
              className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-semibold leading-snug text-body-on-dark">
                  {activity.title}
                </h2>
                <span
                  className={`rounded-sm border px-3 py-1.5 text-sm font-semibold ${getStatusClassName(
                    activity.status,
                  )}`}
                >
                  {activity.statusLabel}
                </span>
              </div>

              <div className="mt-8 border-t border-hairline-on-dark pt-6">
                <p className="text-sm text-muted">최고점</p>
                <span
                  className={`mt-3 inline-flex min-h-9 items-center rounded-md px-4 text-sm font-semibold ${getScoreClassName(
                    activity.bestScore,
                  )}`}
                >
                  {activity.bestScore === null
                    ? "-"
                    : `${activity.bestScore}점`}
                </span>
              </div>

              {activity.href ? (
                <Link
                  className="button-primary mt-8 w-full"
                  href={activity.href}
                >
                  {activity.actionLabel}
                </Link>
              ) : (
                <button
                  className={
                    activity.status === "completed"
                      ? "mt-8 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-correct/40 bg-canvas-dark px-6 text-sm font-semibold text-correct transition hover:bg-surface-elevated-dark"
                      : "button-primary mt-8 w-full"
                  }
                  type="button"
                >
                  {activity.actionLabel}
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
