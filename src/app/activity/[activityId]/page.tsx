"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import ActivityRunner, {
  type ActivityRunnerResult,
  type ActivityRunnerQuestion,
} from "@/components/ActivityRunner";
import { auth, db } from "@/lib/firebase";
import type { Activity } from "@/types/activity";

type LoadedActivity = Activity & {
  id: string;
};

function normalizeQuestion(
  id: string,
  data: Record<string, unknown>,
): ActivityRunnerQuestion {
  const type = typeof data.type === "string" ? data.type : "unsupported";
  const prompt = typeof data.prompt === "string" ? data.prompt : "";
  const explanation =
    typeof data.explanation === "string" ? data.explanation : undefined;

  if (type === "word_arrangement") {
    return {
      id,
      type,
      prompt,
      explanation,
      hint: typeof data.hint === "string" ? data.hint : undefined,
      words: Array.isArray(data.words)
        ? data.words.filter((w): w is string => typeof w === "string")
        : [],
      wordAnswer: Array.isArray(data.answer)
        ? data.answer.filter((a): a is string => typeof a === "string")
        : [],
      acceptableAnswers: Array.isArray(data.acceptableAnswers)
        ? (data.acceptableAnswers as unknown[]).map((row) =>
            Array.isArray(row)
              ? row.filter((a): a is string => typeof a === "string")
              : [],
          )
        : undefined,
      properNounIndices: Array.isArray(data.properNounIndices)
        ? data.properNounIndices.filter(
            (i): i is number => typeof i === "number",
          )
        : undefined,
    };
  }

  if (type === "sentence_construction") {
    return {
      id,
      type,
      prompt,
      explanation,
      koreanHint: typeof data.koreanHint === "string" ? data.koreanHint : "",
      givenWords: Array.isArray(data.givenWords)
        ? data.givenWords.filter((w): w is string => typeof w === "string")
        : [],
      sentenceAnswer: typeof data.answer === "string" ? data.answer : "",
      scAcceptableAnswers: Array.isArray(data.acceptableAnswers)
        ? (data.acceptableAnswers as unknown[]).filter(
            (a): a is string => typeof a === "string",
          )
        : undefined,
    };
  }

  return {
    id,
    type,
    prompt,
    explanation,
    choices: Array.isArray(data.choices)
      ? data.choices.filter(
          (choice): choice is string => typeof choice === "string",
        )
      : undefined,
    answer: typeof data.answer === "number" ? data.answer : undefined,
  };
}

export default function ActivityPage() {
  const params = useParams<{ activityId: string }>();
  const router = useRouter();
  const activityId = params.activityId;
  const hasSavedAttemptRef = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [activity, setActivity] = useState<LoadedActivity | null>(null);
  const [questions, setQuestions] = useState<ActivityRunnerQuestion[]>([]);
  const [missingQuestionIds, setMissingQuestionIds] = useState<string[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [savedAttemptId, setSavedAttemptId] = useState("");
  const [saveErrorMessage, setSaveErrorMessage] = useState("");

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
  }, [activityId, user]);

  async function getNextAttemptNumber(currentUser: User) {
    try {
      const attemptsSnapshot = await getDocs(
        query(
          collection(db, "attempts"),
          where("studentId", "==", currentUser.uid),
        ),
      );
      const activityAttempts = attemptsSnapshot.docs.filter(
        (attemptDoc) => attemptDoc.data().activityId === activityId,
      );

      return activityAttempts.length + 1;
    } catch {
      return 1;
    }
  }

  async function handleComplete(result: ActivityRunnerResult) {
    if (!user || !activity || hasSavedAttemptRef.current) {
      return;
    }

    hasSavedAttemptRef.current = true;
    setSaveStatus("saving");
    setSaveErrorMessage("");

    try {
      const attemptNumber = await getNextAttemptNumber(user);
      const docRef = await addDoc(collection(db, "attempts"), {
        studentId: user.uid,
        studentEmail: user.email,
        activityId,
        activityTitle: activity.title,
        attemptNumber,
        score: result.score,
        finalScore: result.finalScore,
        firstRoundScore: result.firstRoundScore,
        bestScore: result.bestScore,
        totalFullRounds: result.totalFullRounds,
        totalReviewRounds: result.totalReviewRounds,
        totalAnsweredCount: result.totalAnsweredCount,
        durationSec: result.durationSec,
        completed: result.completed,
        startedAt: result.startedAt,
        finishedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        details: result.details,
        roundSummaries: result.roundSummaries,
      });

      setSavedAttemptId(docRef.id);
      setSaveStatus("saved");
    } catch (error) {
      hasSavedAttemptRef.current = false;
      setSaveStatus("error");
      setSaveErrorMessage(
        error instanceof Error
          ? error.message
          : "학습 결과 저장 중 알 수 없는 오류가 발생했습니다.",
      );
    }
  }

  if (isCheckingAuth || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas-light px-5 text-body-on-light">
        <p className="text-sm text-muted">
          {isCheckingAuth
            ? "로그인 상태를 확인하고 있습니다."
            : "활동과 문항을 불러오고 있습니다."}
        </p>
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
      <ActivityRunner
        activityTitle={activity.title}
        questions={questions}
        saveStatus={saveStatus}
        savedAttemptId={savedAttemptId}
        saveErrorMessage={saveErrorMessage}
        onComplete={handleComplete}
      />
    </>
  );
}
