"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import ActivityRunner, {
  type ActivityRunnerQuestion,
} from "@/components/ActivityRunner";
import { db } from "@/lib/firebase";
import type { Activity } from "@/types/activity";

type LoadedActivity = Activity & {
  id: string;
};

function normalizeQuestion(
  id: string,
  data: Record<string, unknown>,
): ActivityRunnerQuestion {
  return {
    id,
    type: typeof data.type === "string" ? data.type : "unsupported",
    prompt: typeof data.prompt === "string" ? data.prompt : "",
    choices: Array.isArray(data.choices)
      ? data.choices.filter((choice): choice is string => typeof choice === "string")
      : undefined,
    answer: typeof data.answer === "number" ? data.answer : undefined,
    explanation:
      typeof data.explanation === "string" ? data.explanation : undefined,
  };
}

export default function ActivityPage() {
  const params = useParams<{ activityId: string }>();
  const activityId = params.activityId;
  const [activity, setActivity] = useState<LoadedActivity | null>(null);
  const [questions, setQuestions] = useState<ActivityRunnerQuestion[]>([]);
  const [missingQuestionIds, setMissingQuestionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadActivity() {
      setIsLoading(true);
      setErrorMessage("");
      setMissingQuestionIds([]);

      try {
        const activitySnapshot = await getDoc(doc(db, "activities", activityId));

        if (!activitySnapshot.exists()) {
          setErrorMessage("해당 활동을 찾을 수 없습니다.");
          return;
        }

        const activityData = {
          id: activitySnapshot.id,
          ...(activitySnapshot.data() as Activity),
        };

        setActivity(activityData);

        if (!Array.isArray(activityData.questionIds)) {
          setErrorMessage("활동의 문항 ID 목록이 올바르지 않습니다.");
          return;
        }

        if (activityData.questionIds.length === 0) {
          setQuestions([]);
          return;
        }

        const questionSnapshots = await Promise.all(
          activityData.questionIds.map((questionId) =>
            getDoc(doc(db, "questions", questionId)),
          ),
        );

        const loadedQuestions: ActivityRunnerQuestion[] = [];
        const missingIds: string[] = [];

        questionSnapshots.forEach((questionSnapshot, index) => {
          const questionId = activityData.questionIds[index];

          if (!questionSnapshot.exists()) {
            missingIds.push(questionId);
            return;
          }

          loadedQuestions.push(
            normalizeQuestion(questionSnapshot.id, questionSnapshot.data()),
          );
        });

        setQuestions(loadedQuestions);
        setMissingQuestionIds(missingIds);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? `활동을 불러오지 못했습니다: ${error.message}`
            : "활동을 불러오는 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (activityId) {
      loadActivity();
    }
  }, [activityId]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas-light px-5 text-body-on-light">
        <p className="text-sm text-muted">활동과 문항을 불러오고 있습니다.</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-canvas-light px-5 py-10 text-body-on-light">
        <section className="mx-auto max-w-learning rounded-xl border border-incorrect bg-canvas-light p-6 sm:p-8">
          <p className="text-sm font-semibold text-incorrect">불러오기 실패</p>
          <h1 className="mt-4 text-2xl font-bold text-body-on-light">
            활동을 시작할 수 없습니다.
          </h1>
          <p className="mt-3 text-sm leading-6 text-body-on-light">
            {errorMessage}
          </p>
          <Link className="button-primary mt-6" href="/dashboard">
            대시보드로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  if (!activity) {
    return null;
  }

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-canvas-light px-5 py-10 text-body-on-light">
        <section className="mx-auto max-w-learning rounded-xl border border-hairline-on-light bg-canvas-light p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">{activity.title}</p>
          <h1 className="mt-4 text-2xl font-bold text-body-on-light">
            풀이할 문항이 없습니다.
          </h1>
          {missingQuestionIds.length > 0 ? (
            <p className="mt-3 text-sm leading-6 text-muted">
              누락된 문항 ID: {missingQuestionIds.join(", ")}
            </p>
          ) : null}
          <Link className="button-primary mt-6" href="/dashboard">
            대시보드로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  return (
    <>
      {missingQuestionIds.length > 0 ? (
        <div className="bg-canvas-light px-5 pt-5 text-body-on-light">
          <div className="mx-auto max-w-learning rounded-lg border border-incorrect bg-[#fff2f2] p-4 text-sm">
            일부 문항을 찾을 수 없습니다: {missingQuestionIds.join(", ")}
          </div>
        </div>
      ) : null}
      <ActivityRunner activityTitle={activity.title} questions={questions} />
    </>
  );
}
