"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Activity } from "@/types/activity";

type DashboardActivity = Activity & {
  id: string;
};

function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStatusClassName() {
  return "border-hairline-on-dark bg-canvas-dark text-muted";
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const today = getTodayDate();

  const groupedActivities = useMemo(() => {
    const todayActivities = activities.filter(
      (activity) => activity.date === today,
    );
    const upcomingActivities = activities.filter(
      (activity) => activity.date > today,
    );
    const pastActivities = activities
      .filter((activity) => activity.date < today)
      .slice()
      .reverse();

    return {
      todayActivities,
      upcomingActivities,
      pastActivities,
    };
  }, [activities, today]);

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

  useEffect(() => {
    if (!user) {
      return;
    }

    async function loadActivities() {
      setIsLoadingActivities(true);
      setErrorMessage("");

      try {
        const snapshot = await getDocs(
          query(collection(db, "activities"), orderBy("date", "asc")),
        );

        const allActivities = snapshot.docs.map((activityDoc) => ({
          id: activityDoc.id,
          ...(activityDoc.data() as Activity),
        }));

        setActivities(
          allActivities.filter((activity) => activity.assignedTo === "all"),
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? `활동 목록을 불러오지 못했습니다: ${error.message}`
            : "활동 목록을 불러오는 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setIsLoadingActivities(false);
      }
    }

    loadActivities();
  }, [user]);

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

        {isLoadingActivities ? (
          <p className="mt-10 rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6 text-sm text-muted">
            활동 목록을 불러오고 있습니다.
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-10 rounded-xl border border-incorrect bg-surface-card-dark p-6 text-sm text-body-on-dark">
            {errorMessage}
          </p>
        ) : null}

        {!isLoadingActivities && !errorMessage ? (
          <div className="mt-10 grid gap-10">
            <ActivitySection
              title="오늘 배정된 활동"
              emptyMessage="오늘 배정된 활동이 없습니다."
              activities={groupedActivities.todayActivities}
            />
            {groupedActivities.upcomingActivities.length > 0 ? (
              <ActivitySection
                title="예정된 활동"
                activities={groupedActivities.upcomingActivities}
              />
            ) : null}
            {groupedActivities.pastActivities.length > 0 ? (
              <ActivitySection
                title="지난 활동"
                activities={groupedActivities.pastActivities}
              />
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function ActivitySection({
  title,
  emptyMessage,
  activities,
}: {
  title: string;
  emptyMessage?: string;
  activities: DashboardActivity[];
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-body-on-dark">{title}</h2>
        <span className="text-sm text-muted">{activities.length}개</span>
      </div>

      {activities.length === 0 ? (
        <p className="mt-4 rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6 text-sm text-muted">
          {emptyMessage || "표시할 활동이 없습니다."}
        </p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {activities.map((activity) => (
            <ActivityCard activity={activity} key={activity.id} />
          ))}
        </div>
      )}
    </section>
  );
}

function ActivityCard({ activity }: { activity: DashboardActivity }) {
  return (
    <article className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">{activity.date}</p>
          <h3 className="mt-3 text-xl font-semibold leading-snug text-body-on-dark">
            {activity.title}
          </h3>
        </div>
        <span
          className={`rounded-sm border px-3 py-1.5 text-sm font-semibold ${getStatusClassName()}`}
        >
          미시작
        </span>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 border-t border-hairline-on-dark pt-6">
        <div>
          <p className="text-sm text-muted">문항 수</p>
          <span className="mt-3 inline-flex min-h-9 items-center rounded-md bg-surface-elevated-dark px-4 text-sm font-semibold text-body-on-dark">
            {activity.questionIds.length}개
          </span>
        </div>
        <div>
          <p className="text-sm text-muted">상태</p>
          <span className="mt-3 inline-flex min-h-9 items-center rounded-md bg-surface-elevated-dark px-4 text-sm font-semibold text-body-on-dark">
            미시작
          </span>
        </div>
      </div>

      <Link className="button-primary mt-8 w-full" href={`/activity/${activity.id}`}>
        시작하기
      </Link>
    </article>
  );
}
