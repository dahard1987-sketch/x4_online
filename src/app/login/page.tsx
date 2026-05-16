"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

function getLoginErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "로그인 중 알 수 없는 오류가 발생했습니다.";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas-dark px-5 py-16 text-body-on-dark">
      <section className="w-full max-w-[420px]">
        <div className="mb-10 flex justify-center">
          <Image
            src="/canb-logo.png"
            alt="CANB English"
            width={1109}
            height={544}
            priority
            className="h-24 w-auto"
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6 sm:p-8"
        >
          <div>
            <p className="text-sm font-semibold text-primary">
              CANB English
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-body-on-dark">
              이메일로 로그인
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              등록된 이메일과 비밀번호로 학습 화면에 접속합니다.
            </p>
          </div>

          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-body-on-dark">
                이메일
              </span>
              <input
                className="field-on-dark mt-2"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-body-on-dark">
                비밀번호
              </span>
              <input
                className="field-on-dark mt-2"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
          </div>

          {errorMessage ? (
            <p className="mt-5 rounded-lg border border-incorrect bg-canvas-dark px-4 py-3 text-sm leading-6 text-body-on-dark">
              {errorMessage}
            </p>
          ) : null}

          <button
            className="button-primary mt-7 w-full"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "로그인 중" : "로그인"}
          </button>
        </form>
      </section>
    </main>
  );
}
