import Image from "next/image";

const coreValues = [
  {
    label: "Daily Routine",
    title: "매일 정해진 학습",
    description:
      "학생은 날짜별로 부여된 문법 활동을 확인하고, 하루 단위의 학습 흐름에 집중합니다.",
  },
  {
    label: "Repeat to 100",
    title: "100점까지 반복",
    description:
      "한 번 풀고 끝나는 방식이 아니라, 틀린 문항을 다시 만나 완전한 이해까지 이어갑니다.",
  },
  {
    label: "Clear Record",
    title: "학습 이력 기록",
    description:
      "시도, 라운드, 점수 흐름을 남겨 학생의 현재 상태를 명확하게 볼 수 있게 합니다.",
  },
];

const flowSteps = [
  "오늘의 활동 확인",
  "문항 풀이",
  "즉시 피드백",
  "오답 반복",
  "100점 완료",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas-dark text-body-on-dark">
      <header className="sticky top-0 z-10 border-b border-hairline-on-dark bg-canvas-dark/95">
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
          <div className="hidden items-center gap-7 text-sm font-semibold text-muted sm:flex">
            <a className="transition hover:text-body-on-dark" href="#values">
              핵심 가치
            </a>
            <a className="transition hover:text-body-on-dark" href="#flow">
              학습 흐름
            </a>
            <a className="transition hover:text-body-on-dark" href="#guide">
              안내
            </a>
          </div>
          <a className="button-secondary-on-dark" href="#flow">
            흐름 보기
          </a>
        </nav>
      </header>

      <section id="top" className="border-b border-hairline-on-dark">
        <div className="mx-auto grid max-w-page gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="mb-5 text-sm font-semibold uppercase tracking-normal text-primary">
              CANB English Online Learning
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-body-on-dark sm:text-5xl lg:text-hero">
              매일 정해진 문법 학습을 100점까지 반복합니다.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              CANB English 온라인 학습 플랫폼은 학생이 날짜별 문항을 풀고,
              틀린 문항을 다시 학습하며, 완성도 높은 반복 학습을 이어가도록
              설계됩니다.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a className="button-primary-pill" href="#values">
                핵심 가치 보기
              </a>
              <a className="button-secondary-on-dark" href="#guide">
                학생/학부모 안내
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6 sm:p-8">
            <Image
              src="/canb-logo.png"
              alt="CANB English"
              width={1109}
              height={544}
              priority
              className="h-24 w-auto"
            />
            <div className="mt-8 border-t border-hairline-on-dark pt-8">
              <p className="text-sm font-semibold text-primary">
                학습 원칙
              </p>
              <p className="mt-3 text-2xl font-semibold leading-snug text-body-on-dark">
                오늘 배운 문법은 오늘 끝까지 확인합니다.
              </p>
              <p className="mt-4 text-sm leading-6 text-muted">
                반복 학습 알고리즘과 기록 기능은 후속 단계에서 구현됩니다.
                현재 화면은 서비스의 방향과 디자인 시스템을 보여주는
                랜딩페이지입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="values" className="mx-auto max-w-page px-5 py-section sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Core Value</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-body-on-dark sm:text-display-lg">
            한 가지 학습 가치를 선명하게
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {coreValues.map((value) => (
            <article
              key={value.title}
              className="rounded-lg border border-hairline-on-dark bg-surface-card-dark p-6"
            >
              <p className="text-sm font-semibold text-primary">
                {value.label}
              </p>
              <h3 className="mt-5 text-xl font-semibold text-body-on-dark">
                {value.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                {value.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="flow" className="border-y border-hairline-on-dark bg-surface-card-dark">
        <div className="mx-auto max-w-page px-5 py-section sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[360px_1fr]">
            <div>
              <p className="text-sm font-semibold text-primary">Learning Flow</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-body-on-dark sm:text-display-lg">
                단순하고 반복 가능한 흐름
              </h2>
              <p className="mt-5 text-sm leading-6 text-muted">
                실제 문항 풀이 기능은 후속 Phase에서 구현됩니다. 이번 단계는
                학습 흐름을 이해할 수 있는 정적 구조만 제공합니다.
              </p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-5 lg:items-stretch">
              {flowSteps.map((step, index) => (
                <li
                  key={step}
                  className="flex min-h-32 flex-col justify-between rounded-lg border border-hairline-on-dark bg-canvas-dark p-5"
                >
                  <span className="text-sm font-semibold text-primary">
                    0{index + 1}
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
            <p className="text-sm font-semibold text-primary">For Students</p>
            <h2 className="mt-4 text-2xl font-semibold text-body-on-dark">
              학생은 오늘 해야 할 학습에 집중합니다.
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              날짜별 활동, 문항 풀이, 즉시 피드백, 100점 완료 흐름을 중심으로
              학습 경험이 구성될 예정입니다.
            </p>
          </article>
          <article className="rounded-lg border border-hairline-on-dark bg-surface-card-dark p-6 sm:p-8">
            <p className="text-sm font-semibold text-primary">For Parents</p>
            <h2 className="mt-4 text-2xl font-semibold text-body-on-dark">
              학부모는 반복 학습의 결과를 확인합니다.
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              학습 이력과 점수 흐름은 후속 단계에서 기록되며, 학생의 학습
              지속성을 확인하는 기준이 됩니다.
            </p>
          </article>
        </div>
      </section>

      <footer className="bg-surface-soft-light text-ink">
        <div className="mx-auto flex max-w-page flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Image
            src="/canb-logo.png"
            alt="CANB English"
            width={1109}
            height={544}
            className="h-8 w-auto"
          />
          <p className="text-sm text-muted">
            CANB English 온라인 학습 플랫폼 · 문법 반복 학습
          </p>
        </div>
      </footer>
    </main>
  );
}
