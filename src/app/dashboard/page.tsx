import Image from "next/image";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-canvas-dark px-5 py-16 text-body-on-dark">
      <section className="mx-auto max-w-learning">
        <Image
          src="/canb-logo.png"
          alt="CANB English"
          width={1109}
          height={544}
          priority
          className="h-12 w-auto"
        />

        <div className="mt-10 rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold text-body-on-dark">
            오늘의 활동은 아직 준비 중입니다.
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            로그인 연결 확인을 위한 임시 화면입니다. 실제 활동 카드와 학습
            기능은 후속 Phase에서 구현합니다.
          </p>
        </div>
      </section>
    </main>
  );
}
