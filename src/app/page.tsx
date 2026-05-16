import Image from "next/image";
import Link from "next/link";

const coreValues = [
  {
    title: "날짜별 학습",
    description:
      "학생은 오늘 부여된 문법 활동을 확인하고, 정해진 분량에 집중합니다.",
  },
  {
    title: "100점까지 반복",
    description:
      "틀린 문항만 다시 풀며, 활동이 100점으로 끝날 때까지 학습을 이어갑니다.",
  },
  {
    title: "학습 이력 자동 기록",
    description:
      "점수, 라운드, 시도 흐름을 남겨 학생의 학습 상태를 명확하게 확인합니다.",
  },
];

const learningSteps = [
  "오늘의 활동 확인",
  "문항 풀이",
  "오답만 반복",
  "100점 완료",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas-dark text-body-on-dark">
      <header className="sticky top-0 z-10 border-b border-hairline-on-dark bg-canvas-dark">
        <nav
          aria-label="CANB English"
          className="mx-auto flex h-16 max-w-page items-center justify-between px-5 sm:px-6 lg:px-8"
        >
          <a href="#top" className="flex items-center">
            <Image
              src="/canb-logo.png"
              alt="CANB English"
              width={1109}
              height={544}
              priority
              className="h-9 w-auto"
            />
          </a>

          <div className="hidden items-center gap-7 text-sm font-semibold text-muted md:flex">
            <a className="transition hover:text-body-on-dark" href="#guide">
              학습 안내
            </a>
            <Link className="transition hover:text-body-on-dark" href="/login">
              학습 시작
            </Link>
            <Link className="transition hover:text-body-on-dark" href="/login">
              관리자
            </Link>
          </div>
        </nav>
      </header>

      <section id="top" className="border-b border-hairline-on-dark">
        <div className="mx-auto grid max-w-page gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_420px] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="mb-5 text-sm font-semibold uppercase tracking-normal text-primary">
              CANB English Online Learning
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-body-on-dark sm:text-5xl lg:text-hero">
              매일 정해진 문법 학습을 100점까지
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              CANB English 온라인 학습은 학생이 날짜별 문법 문항을 풀고,
              100점을 받을 때까지 반복하도록 설계된 학습 플랫폼입니다.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="button-primary-pill" href="/login">
                학습 시작
              </Link>
              <a className="button-secondary-on-dark" href="#flow">
                학습 방식 보기
              </a>
            </div>
          </div>

          <aside
            aria-label="학습 현황 미리보기"
            className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">
                  오늘의 활동
                </p>
                <h2 className="mt-3 text-2xl font-semibold leading-snug text-body-on-dark">
                  중등 문법 반복 학습
                </h2>
              </div>
              <span className="rounded-sm border border-hairline-on-dark bg-surface-elevated-dark px-3 py-2 text-sm font-semibold text-primary">
                진행중
              </span>
            </div>

            <div className="mt-8 space-y-4 border-t border-hairline-on-dark pt-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted">진행 상태</span>
                <span className="text-sm font-semibold text-body-on-dark">
                  2라운드
                </span>
              </div>
              <div className="h-2 rounded-pill bg-surface-elevated-dark">
                <div className="h-2 w-3/4 rounded-pill bg-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg border border-hairline-on-dark bg-canvas-dark p-4">
                  <p className="text-sm text-muted">최고점</p>
                  <p className="mt-3 text-3xl font-bold text-body-on-dark">
                    92
                  </p>
                </div>
                <div className="rounded-lg border border-primary bg-primary p-4 text-on-primary">
                  <p className="text-sm font-semibold">완료 목표</p>
                  <p className="mt-3 text-3xl font-bold">100점</p>
                </div>
              </div>
              <div className="rounded-lg border border-hairline-on-dark bg-canvas-dark px-4 py-3">
                <p className="text-sm font-semibold text-primary">
                  100점 완료 배지
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  100점 도달 시 활동 완료 상태로 기록됩니다.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="values" className="mx-auto max-w-page px-5 py-section sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Core Value</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-body-on-dark sm:text-display-lg">
            매일의 문법 학습을 끝까지 이어가게 합니다.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {coreValues.map((value) => (
            <article
              key={value.title}
              className="rounded-lg border border-hairline-on-dark bg-surface-card-dark p-6"
            >
              <h3 className="text-xl font-semibold text-body-on-dark">
                {value.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-muted">
                {value.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="flow" className="border-y border-hairline-on-dark bg-surface-card-dark">
        <div className="mx-auto max-w-page px-5 py-section sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
            <div>
              <p className="text-sm font-semibold text-primary">Learning Flow</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-body-on-dark sm:text-display-lg">
                4단계 학습 흐름
              </h2>
              <p className="mt-5 text-sm leading-6 text-muted">
                실제 문항 풀이 기능은 후속 Phase에서 구현됩니다. 이번
                랜딩페이지는 CANB English의 핵심 학습 흐름만 보여줍니다.
              </p>
            </div>

            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {learningSteps.map((step, index) => (
                <li
                  key={step}
                  className="flex min-h-32 flex-col justify-between rounded-lg border border-hairline-on-dark bg-canvas-dark p-5"
                >
                  <span className="text-sm font-semibold text-primary">
                    {index + 1}단계
                  </span>
                  <span className="mt-8 text-base font-semibold text-body-on-dark">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="guide" className="mx-auto max-w-page px-5 py-section sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-lg border border-hairline-on-dark bg-surface-card-dark p-6 sm:p-8">
            <p className="text-sm font-semibold text-primary">Students</p>
            <h2 className="mt-4 text-2xl font-semibold text-body-on-dark">
              학생은 매일 무엇을 해야 하는지 명확히 알 수 있습니다.
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              오늘의 활동을 확인하고, 문항을 풀고, 오답만 다시 반복하는
              방식으로 학습 목표를 분명하게 유지합니다.
            </p>
          </article>
          <article className="rounded-lg border border-hairline-on-dark bg-surface-card-dark p-6 sm:p-8">
            <p className="text-sm font-semibold text-primary">
              Parents & Teachers
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-body-on-dark">
              학부모와 선생님은 학습 이력을 확인할 수 있습니다.
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              점수와 반복 흐름은 후속 단계에서 기록되며, 학생이 꾸준히
              학습했는지 확인하는 기준이 됩니다.
            </p>
          </article>
        </div>
      </section>

      <footer className="bg-surface-soft-light text-ink">
        <div className="mx-auto flex max-w-page flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Image
              src="/canb-logo.png"
              alt="CANB English"
              width={1109}
              height={544}
              className="h-8 w-auto"
            />
            <span className="text-sm font-semibold">CANB English</span>
          </div>
          <p className="text-sm text-muted">온라인 문법 학습 플랫폼</p>
        </div>
      </footer>
    </main>
  );
}
