# CANB English — 학습 플랫폼 명세

> 새로 구축할 영어 학습 플랫폼의 통합 명세. 홈페이지 + 문법학습 모듈을 처음부터 구축하며, Firebase 기반으로 운영됨.
> 이 문서는 GPT(코딩 어시스턴트)에 컨텍스트로 전달하기 위해 작성됨.

---

## 1. 프로젝트 개요

- **브랜드**: CANB English
- **목적**: 학원 학생들이 날짜별로 부여된 문법 문항을 풀고, 100점 받을 때까지 반복하며, 학습 이력이 자동 기록되는 플랫폼
- **초기 규모**: 학생 50명 (시험 운영) → 1,000명 (확장)
- **핵심 가치**: "매일 정해진 학습을 100점 받을 때까지 반복" — 이 한 가지를 매우 잘 해내는 것

---

## 2. 기술 스택

- **프론트엔드**: Next.js 14 (App Router) + TypeScript
- **스타일**: Tailwind CSS
- **백엔드/DB**: Firebase
  - Firestore (DB)
  - Firebase Authentication (이메일/비밀번호)
  - Firebase Hosting (배포)
  - Cloud Functions (집계 자동화, 후속 단계)
- **클라이언트 캐싱**: IndexedDB (문항 데이터)

> 버전 명시 필수: Firebase v9 modular SDK, Next.js 14 App Router 기준.

---

## 3. 브랜드 아이덴티티

### 3-1. 로고

업로드된 `CANB_07_로고.png`를 유일한 브랜드 마크로 사용. 변형/재제작 금지.

- 상단 네비게이션 좌측에 배치 (높이 32~40px)
- 로그인 화면 중앙 상단에 배치 (높이 80~120px)
- 푸터에 축소 버전 배치 가능
- 어두운 배경에서는 그대로, 밝은 배경에서도 그대로 사용 (로고의 마젠타는 양쪽 캔버스에서 대비 확보됨)

### 3-2. 톤 & 보이스

CANB English의 디자인 원칙은 **"트레이딩 플랫폼의 응축된 명확함을 영어 학습에 적용"** 이다. Binance 디자인 시스템에서 차용한 핵심 원리:

- **단일 액센트 컬러로 모든 브랜드 보이스 표현** (CANB Magenta가 Binance Yellow의 역할)
- **다크 캔버스를 기본**으로 하되, 학습 풀이 화면 등 집중이 필요한 곳은 밝은 캔버스
- **플랫 서피스 + 색상 대비**로 깊이감 표현 (그림자/그라데이션 최소화)
- **타이포그래피의 무게로 정보 위계 표현**

차이점:
- 트레이딩 컬러(빨강/초록)는 사용하지 않음. 학습에서는 정답/오답을 다른 톤으로 표현
- 모든 숫자에 별도 폰트(BinancePlex)를 쓰지 않음. 단일 폰트 패밀리 사용

---

## 4. 디자인 시스템

### 4-1. 컬러

#### Brand & Accent
- **CANB Magenta** (`{colors.primary}` — #B0157A): 단일 브랜드 컬러. 모든 Primary CTA, 핵심 헤드라인, 강조 요소. 로고에서 추출.
- **CANB Magenta Active** (`{colors.primary-active}` — #8E1163): 누름/호버 시 어두워지는 변형.
- **CANB Magenta Disabled** (`{colors.primary-disabled}` — #3a1226): 다크 캔버스 위 비활성 CTA용.
- **CANB Magenta Subtle** (`{colors.primary-subtle}` — #fae8f2): 라이트 캔버스 위 배경 강조용 (배지, 하이라이트).

> 정확한 색상값은 로고 이미지에서 컬러 피커로 추출해 미세 조정. 위 값은 시작점.

#### Surface (Dark — 기본)
- **Canvas Dark** (`{colors.canvas-dark}` — #0F0E12): 페이지 바닥. 순흑이 아닌, 마젠타 쪽으로 살짝 기운 어두움.
- **Surface Card Dark** (`{colors.surface-card-dark}` — #1C1A20): 카드, 드롭다운, 다크 위 보조 버튼.
- **Surface Elevated Dark** (`{colors.surface-elevated-dark}` — #2A2730): 한 단계 더 떠 있는 카드, 호버 상태.

#### Surface (Light — 학습 풀이 화면)
- **Canvas Light** (`{colors.canvas-light}` — #ffffff): 학습 풀이 화면, 폼.
- **Surface Soft Light** (`{colors.surface-soft-light}` — #faf8fa): 푸터, 비활성 상태.
- **Surface Strong Light** (`{colors.surface-strong-light}` — #f3f0f3): 폼 입력 배경.

#### Hairlines & Borders
- **Hairline on Light** (`{colors.hairline-on-light}` — #e8e4ea): 라이트 위 1px 보더.
- **Hairline on Dark** (`{colors.hairline-on-dark}` — #2A2730): 다크 위 1px 보더 (Surface Elevated와 동일한 톤).

#### Text
- **Ink** (`{colors.ink}` — #1A1820): 라이트 위 가장 진한 텍스트.
- **Body on Dark** (`{colors.body-on-dark}` — #E8E4EA): 다크 위 본문. 순백이 아닌 살짝 따뜻한 톤.
- **Body on Light** (`{colors.body-on-light}` — #1A1820): 라이트 위 본문.
- **Muted** (`{colors.muted}` — #807885): 캡션, 보조 라벨. 양쪽 캔버스에서 작동.
- **On Primary** (`{colors.on-primary}` — #ffffff): 마젠타 위 텍스트 (흰색).

#### Semantic (학습 피드백)
- **Correct** (`{colors.correct}` — #1E9E6A): 정답 표시. 차분한 그린.
- **Incorrect** (`{colors.incorrect}` — #D14343): 오답 표시. 차분한 레드.
- **Info** (`{colors.info}` — #3B82F6): 안내, 포커스 링.

> Binance와 달리 정답/오답 컬러를 채도 낮게 사용 (학습은 비난이 아니라 안내).

### 4-2. 타이포그래피

#### Font Family
- **Display & Body**: `Pretendard` (한글 + 영문 통합 지원). 폴백: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- 영어 학습 콘텐츠가 많으므로 영문 가독성 우수한 폰트 선택
- 별도 숫자 전용 폰트는 사용하지 않음 (Pretendard tabular nums 활용)

#### Hierarchy

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `{typography.hero-display}` | 56px | 700 | 1.1 | 홈페이지 메인 헤드라인 |
| `{typography.display-lg}` | 40px | 700 | 1.15 | 섹션 헤드라인 |
| `{typography.display-md}` | 32px | 600 | 1.2 | 페이지 타이틀 |
| `{typography.title-lg}` | 24px | 600 | 1.3 | 카드 타이틀, 문항 본문 |
| `{typography.title-md}` | 20px | 600 | 1.35 | 서브 타이틀 |
| `{typography.title-sm}` | 16px | 600 | 1.4 | 작은 카드 타이틀, 버튼 |
| `{typography.body-md}` | 15px | 400 | 1.6 | 본문 |
| `{typography.body-sm}` | 13px | 400 | 1.5 | 보조 텍스트, 캡션 |
| `{typography.button}` | 14px | 600 | 1 | CTA 버튼 라벨 |
| `{typography.question-body}` | 18px | 500 | 1.6 | 문항 풀이 화면의 문제 본문 (가독성 우선) |
| `{typography.mono}` | 15px | 400 | 1.6 | 영어 예문, 코드 (`SF Mono`, `Menlo` 폴백) |

> 학습 풀이 화면의 문항 본문은 일반 본문보다 큰 18px로 설정 — 학생이 집중해서 읽어야 하는 텍스트.

### 4-3. 레이아웃 & 스페이싱

- **베이스 단위**: 4px
- **토큰**: `{spacing.xxs}` 4 · `{spacing.xs}` 8 · `{spacing.sm}` 12 · `{spacing.md}` 16 · `{spacing.lg}` 24 · `{spacing.xl}` 32 · `{spacing.xxl}` 48 · `{spacing.section}` 80
- **섹션 수직 패딩**: `{spacing.section}` (80px)
- **카드 내부 패딩**: `{spacing.lg}` (24px) 기본, `{spacing.xl}` (32px) for 큰 카드
- **최대 콘텐츠 너비**: 1200px (홈페이지), 720px (학습 풀이 화면 — 집중도 위해 좁게)

### 4-4. 모서리 (Border Radius)

| Token | Value | Use |
|---|---|---|
| `{rounded.sm}` | 4px | 작은 배지, 인라인 요소 |
| `{rounded.md}` | 6px | 기본 CTA 버튼, 입력 필드 |
| `{rounded.lg}` | 8px | 콘텐츠 카드, 트러스트 배지 |
| `{rounded.xl}` | 12px | 큰 카드 컨테이너 |
| `{rounded.pill}` | 9999px | 상단 핵심 CTA ("학습 시작") |
| `{rounded.full}` | 50% | 아바타, 아이콘 |

### 4-5. 깊이 & 그림자

플랫 디자인 원칙. 그림자 대신 색상 대비로 표현.

- **Flat**: 본문 섹션, 상단 네비, 푸터
- **Soft Hairline**: 입력, 카드 보더, FAQ 구분선
- **Card Surface**: 다크 위 `{colors.surface-card-dark}`, 라이트 위 `{colors.canvas-light}` + 보더
- **Focus Ring**: `0 0 0 2px {colors.info}` at 50% alpha
- **무거운 드롭 섀도우 금지**, **그라데이션 캔버스 금지** (단, 학습 결과 축하 화면 등 1회성 모먼트는 예외)

---

## 5. 핵심 컴포넌트

### 5-1. 네비게이션

**`top-nav-dark`**: 64px 높이, `{colors.canvas-dark}` 배경. 좌측에 CANB 로고, 우측에 메뉴(학습 / 마이페이지 / 관리자) + 로그아웃.

**`top-nav-light`**: 학습 풀이 화면 등 라이트 캔버스용. 같은 구조, 색상만 반전.

### 5-2. 버튼

**`button-primary`**: `{colors.primary}` 배경, 흰색 텍스트, `{rounded.md}`, 패딩 12px × 24px, 높이 40px. 모든 주요 액션.

**`button-primary-pill`**: 동일하지만 `{rounded.pill}`, 패딩 14px × 32px. 페이지 핵심 CTA 1회용.

**`button-secondary-on-dark`**: 다크 위 보조 버튼. `{colors.surface-card-dark}` 배경, 흰 텍스트.

**`button-secondary-on-light`**: 라이트 위 보조 버튼. `{colors.canvas-light}` 배경, `{colors.hairline-on-light}` 1px 보더, `{colors.ink}` 텍스트.

**`button-correct`**: 정답 확인 버튼. `{colors.correct}` 배경, 흰 텍스트. 학습 풀이 결과 화면 전용.

### 5-3. 학습 카드

**`activity-card`**: 학생 홈에서 보이는 "오늘의 활동" 카드. 다크 위 `{colors.surface-card-dark}`, `{rounded.xl}`, 패딩 `{spacing.lg}`. 상단에 활동 제목, 중단에 진행 상태 (미시작/진행중/완료), 하단에 최고점 배지 + "시작하기" 버튼.

**`progress-badge`**: 진행 상태 표시. 미시작은 `{colors.muted}` 텍스트, 진행중은 `{colors.primary}` 텍스트, 완료(100점)는 `{colors.correct}` 텍스트 + 체크 아이콘.

**`score-badge`**: 점수 표시. 100점은 `{colors.primary}` 배경 + 흰 텍스트, 그 이하는 `{colors.surface-elevated-dark}` 배경 + 흰 텍스트.

### 5-4. 문항 풀이 컴포넌트 (라이트 캔버스)

문항 풀이 화면은 라이트 캔버스로 전환. 학생이 오래 집중해야 하므로 눈 피로 최소화.

**`question-frame`**: 풀이 컨테이너. `{colors.canvas-light}` 배경, 최대 너비 720px, 중앙 정렬. 상단에 진행률 바, 중앙에 문항, 하단에 액션 버튼.

**`progress-bar`**: 진행률 바. 높이 4px, `{colors.surface-strong-light}` 트랙, `{colors.primary}` 채움. 상단에 "라운드 1 · 7/20" 같은 라벨.

**`question-prompt`**: 문항 본문. `{typography.question-body}` (18px / 500). 영어 부분은 `{typography.mono}`로 차별화 가능.

**`feedback-banner`**: 정답 제출 후 즉시 피드백. 정답이면 `{colors.correct}` 보더 + 라이트 톤 배경 + 체크 아이콘, 오답이면 `{colors.incorrect}` 보더 + 라이트 톤 배경 + X 아이콘 + 해설.

### 5-5. 관리자 대시보드

**`student-table-row`**: 학생 목록 테이블의 한 줄. 학생 이름 / 최근 활동 / 누적 정답률 / 최고점 / 상세 보기 링크.

**`attempt-history-row`**: 시도 이력 한 줄. 날짜 / 활동명 / 점수 / 라운드 수 / 소요 시간.

### 5-6. 푸터

**`footer-light`**: 다크 페이지 위에도 라이트 푸터. `{colors.surface-soft-light}` 배경. CANB 로고 축소판 + 학원 정보 + 문의 링크.

---

## 6. 화면 구성

### 학생 화면
1. **로그인** — 중앙에 큰 CANB 로고 + 이메일/비번 입력
2. **홈 (오늘의 활동)** — 날짜별 활동 카드 목록, 완료 상태 표시
3. **활동 풀이** — 문항 단위 진행 + 즉시 피드백 (라이트 캔버스)
4. **결과** — 라운드별 점수 그래프, 100점 도달 시 축하 모먼트, 오답 노트 링크
5. **마이페이지** — 누적 학습 통계, 최근 시도 이력

### 관리자(선생님) 화면
1. **로그인** (학생과 별도 권한)
2. **학생 목록** — 학생별 최근 활동, 평균 점수, 미완료 알림
3. **학생 상세** — 시도 이력 표, 활동별 최고점, 정답률 추이
4. **활동 관리** — 활동 생성, 문항 배정, 날짜 설정
5. **문항 관리** — 7가지 유형별 입력 UI, CSV 일괄 업로드

---

## 7. 문법 문항 유형 (7종)

각 유형은 데이터 구조와 UI가 다르므로 명확히 분리. 모든 유형은 공통적으로 `type`, `prompt`, `answer`, `explanation` 필드를 가짐.

### Type 1. 객관식 (`multiple_choice`)

**구조**
```typescript
{
  type: "multiple_choice",
  prompt: string,           // 문제 본문
  choices: string[],        // 보기 (보통 4개)
  answer: number,           // 정답 인덱스
  explanation?: string
}
```

**UI**: 보기를 세로로 나열, 라디오 버튼식 선택. 선택 후 "제출" 버튼.

**예시**
```
Q: 다음 중 어법상 올바른 문장은?
○ She don't like coffee.
● She doesn't like coffee.
○ She not like coffee.
○ She isn't like coffee.
```

---

### Type 2. 문장 성분 선택 (`sentence_parsing`)

학생이 문장의 각 부분을 클릭해 문장 성분(주어/동사/목적어/보어 등)으로 지정.

**구조**
```typescript
{
  type: "sentence_parsing",
  prompt: string,           // 안내문 (예: "각 성분을 찾아 표시하세요")
  sentence: string,         // 분석 대상 문장
  tokens: string[],         // 토큰 단위 분할 (선택지)
  targets: {                // 정답: 각 성분이 어떤 토큰들로 구성되는지
    role: "subject" | "verb" | "object" | "complement" | "modifier" | "prepositional",
    tokenIndices: number[]  // 해당 성분에 포함되는 토큰 인덱스들
  }[],
  explanation?: string
}
```

**UI 흐름**
1. 문장이 토큰 단위(보통 단어)로 클릭 가능하게 표시
2. 학생이 토큰을 하나 또는 여러 개 선택 → 토큰 묶음이 하이라이트됨
3. 옆에 뜬 성분 라벨 버튼 (주어 / 동사 / 목적어 / 보어 / 수식어) 중 선택
4. 선택된 묶음에 성분 라벨이 부여되며, 색상으로 표시
5. 모든 필수 성분을 표시한 후 "제출" 버튼

**예시**
```
The car over there belongs to Mike.

정답:
- "The car over there" → 주어
- "belongs" → 동사
- "to Mike" → 수식어(전치사구) 또는 부사구

데이터:
{
  sentence: "The car over there belongs to Mike.",
  tokens: ["The", "car", "over", "there", "belongs", "to", "Mike"],
  targets: [
    { role: "subject", tokenIndices: [0, 1, 2, 3] },
    { role: "verb", tokenIndices: [4] },
    { role: "prepositional", tokenIndices: [5, 6] }
  ]
}
```

**클래스카드(classcard.net)의 유사 기능 참고** — UI 패턴은 거기서 차용 가능.

---

### Type 3. 단어 배열 (`word_arrangement`)

주어진 단어들을 올바른 어순으로 배열.

**구조**
```typescript
{
  type: "word_arrangement",
  prompt: string,           // 안내문 (예: "주어진 단어를 배열해 문장을 완성하세요")
  hint?: string,            // 한국어 의미 (예: "그는 매일 아침 조깅을 한다.")
  words: string[],          // 섞인 상태로 제시되는 단어들
  answer: string[],         // 정답 순서
  acceptableAnswers?: string[][],  // 복수 정답 허용 (선택)
  explanation?: string
}
```

**UI**: 단어들을 드래그 앤 드롭으로 정렬. 모바일에서는 탭으로 순서대로 추가/제거.

**예시**
```
[한국어 힌트] 그는 매일 아침 조깅을 한다.
[단어들] morning / he / every / jogs

정답: He jogs every morning.
```

---

### Type 4. 단어 활용 + 표현 추가 문장 완성 (`sentence_construction`)

주어진 단어를 문법적으로 활용하고, 필요한 표현(관사, 전치사, be동사 등)을 추가해 문장을 완성.

**구조**
```typescript
{
  type: "sentence_construction",
  prompt: string,                 // 안내문
  koreanHint: string,             // 한국어 의미
  givenWords: string[],           // 학생이 활용해야 하는 단어들 (원형 제시)
  answer: string,                 // 정답 문장
  acceptableAnswers?: string[],   // 허용되는 다른 답
  explanation?: string
}
```

**UI**: 한국어 힌트와 주어진 단어 목록을 보여주고, 학생이 한 줄 텍스트 입력으로 문장 작성.

**채점 로직**: 대소문자/공백/마침표 정규화. `acceptableAnswers`와 비교. 정답 외 답안은 부분 점수 없이 오답 처리하되, 가까운 답안은 해설에서 안내.

**예시**
```
[한국어] 나는 어제 도서관에 갔다.
[단어] I / go / library / yesterday

정답: I went to the library yesterday.
허용: "Yesterday I went to the library." 등
```

---

### Type 5. 이항대립 선택 (`binary_choice`)

문장 내 한 지점에서 두 형태 중 하나 선택. 가장 가벼운 유형.

**구조**
```typescript
{
  type: "binary_choice",
  prompt: string,           // 문장 본문 (선택 지점에 플레이스홀더 포함)
  // 예: "The bus {{choice}} at 7 a.m. every day."
  choices: [string, string], // 두 선택지 (예: ["start", "starts"])
  answer: 0 | 1,            // 정답 인덱스
  explanation?: string
}
```

**UI**: 문장 안의 빈 자리에 두 옵션이 토글 형태로 표시. 학생이 클릭으로 선택.

**예시**
```
The bus [ start | starts ] at 7 a.m. every day.
정답: starts (3인칭 단수)
```

---

### Type 6. 밑줄 부분 어법 판단 + 수정 (`underline_judgment`)

문장 중 밑줄 친 부분이 어법상 맞는지 판단. 틀리면 올바른 표현으로 수정.

**구조**
```typescript
{
  type: "underline_judgment",
  prompt: string,           // 안내문
  sentence: string,         // 전체 문장
  underlinedPart: string,   // 밑줄 친 부분 (정확한 텍스트)
  underlinedStart: number,  // sentence 내 시작 인덱스
  underlinedEnd: number,    // 끝 인덱스
  isCorrect: boolean,       // 이 부분이 어법상 맞는지
  correctedForm?: string,   // 틀린 경우 올바른 표현
  acceptableCorrections?: string[],
  explanation?: string
}
```

**UI 흐름**
1. 문장이 표시되고, 해당 부분에 밑줄 + 강조 표시
2. "O / X" 버튼 두 개 (어법상 맞음 / 틀림)
3. "X"를 선택하면 수정 입력창이 나타남
4. 학생이 수정안 입력 후 제출

**채점 로직**
- O/X 판단이 정답이고, X인 경우 수정안도 `correctedForm` 또는 `acceptableCorrections`와 일치해야 정답

**예시**
```
She have lived in Seoul for ten years.
밑줄: "have"
판단: 틀림
수정: "has"
```

---

### Type 7. 단어를 올바른 형태로 변형 (`word_form`)

주어진 원형 단어를 문맥에 맞게 변형해 빈칸에 채움. 시제, 수동태, 비교급/최상급, 명사화, 형용사화 등.

**구조**
```typescript
{
  type: "word_form",
  prompt: string,                 // 안내문
  sentence: string,               // 문장 (빈칸은 {{blank}} 플레이스홀더)
  baseWord: string,               // 원형 (예: "go")
  hint?: string,                  // 추가 힌트 (예: "과거형" 또는 한국어 의미)
  answer: string,                 // 정답 형태
  acceptableAnswers?: string[],
  explanation?: string
}
```

**UI**: 문장의 빈칸 자리에 입력창, 옆에 원형 단어가 회색으로 표시 (예: `[ ___ ] (go)`).

**예시**
```
I {{blank}} to school yesterday. (go)
힌트: 과거형
정답: went

The {{blank}} of the book surprised me. (end)
힌트: 명사형
정답: ending

This is the {{blank}} movie I've ever seen. (good)
힌트: 최상급
정답: best
```

---

## 8. 반복 학습 알고리즘

```
1. 학생이 활동을 시작 → 활동에 속한 모든 문항이 라운드 1의 출제 목록
2. 라운드 1 진행:
   - 각 문항을 순서대로 풀이
   - 매 문항 정답 제출 시 즉시 피드백 (정답/오답 + 해설)
3. 라운드 종료 시 점수 계산 = (정답 수 / 총 문항 수) × 100
4. 100점이면 활동 완료, 결과 화면으로
5. 100점 미만이면:
   - 틀린 문항만 모아 라운드 2 출제 목록 생성
   - 라운드 2 시작
6. 100점 도달할 때까지 반복
7. 매 라운드의 점수, 라운드 수, 소요 시간을 모두 기록
8. "최고 점수"는 모든 라운드 중 가장 높은 점수 (보통 마지막 라운드)
9. "첫 시도 정답률"은 라운드 1의 점수 (실력 지표로 활용)
```

**중요**: 라운드 2 이후의 문항 순서는 무작위 셔플 (암기 방지).

---

## 9. Firestore 데이터 구조

```
activities/{activityId}
  - title: string
  - date: string ("YYYY-MM-DD")        // 배정 날짜
  - questionIds: string[]              // 포함된 문항 ID 목록
  - assignedTo: string[] | "all"       // 학생 ID 또는 전체
  - createdAt: timestamp
  - updatedAt: timestamp

questions/{questionId}
  - type: 7가지 중 하나
  - 각 유형별 필드 (위 7번 섹션 참조)
  - tags?: string[]                    // 분류 태그 (예: "관계대명사", "시제")
  - difficulty?: "easy" | "medium" | "hard"
  - createdAt, updatedAt

students/{studentId}
  - name: string
  - email: string
  - role: "student"
  - createdAt

admins/{adminId}
  - name, email
  - role: "admin"

students/{studentId}/stats/aggregate
  - totalAttempts: number
  - avgScore: number
  - lastActivityAt: timestamp
  // Cloud Functions로 자동 갱신

attempts/{attemptId}
  - studentId: string
  - activityId: string
  - attemptNumber: number              // 같은 활동의 몇 번째 시도
  - score: number                      // 0-100 (최종 라운드 점수)
  - firstRoundScore: number            // 첫 시도 정답률 (실력 지표)
  - rounds: number                     // 반복 라운드 수
  - durationSec: number                // 총 소요 시간
  - startedAt, finishedAt: timestamp
  - details: {
      questionId: string,
      roundReached: number,            // 몇 라운드에 정답 맞췄는지
      attemptsInActivity: number       // 활동 내에서 이 문항을 푼 횟수
    }[]
```

---

## 10. 비용 최적화 (1,000명 확장 대비)

처음부터 적용:

1. **클라이언트 캐싱**: `questions` 데이터는 한 번 가져오면 IndexedDB에 저장. 같은 활동 재진입 시 Firestore 읽기 0회.
2. **배치 쓰기**: 활동 종료 시 `attempts` 문서 1개 생성. 문항별 풀이 결과는 `details` 배열에 묶어서 1회 쓰기.
3. **통계 집계**: 매번 모든 attempts를 읽지 않고, `students/{id}/stats/aggregate` 문서를 Cloud Functions로 자동 갱신. 대시보드 읽기 1회.

---

## 11. 개발 단계

### Phase 1: 알고리즘 검증 (2~3일)
- HTML 1개 파일에 문항 5개 (7가지 유형 중 3~4개) 하드코딩
- 반복 알고리즘 작동 확인, Firebase 없이

### Phase 2: 디자인 시스템 셋업 (1~2일)
- Next.js 프로젝트 생성, Tailwind 설정
- 디자인 토큰을 `tailwind.config.ts`에 정의
- 로고 SVG/PNG 임포트, 기본 컴포넌트 (버튼, 카드) 구현

### Phase 3: Firebase 연동 + 기본 인증 (2~3일)
- Firebase 프로젝트 생성
- 학생/관리자 로그인
- Firestore 읽기/쓰기로 1번 학생 1번 활동 작동

### Phase 4: 문항 유형 1, 5 구현 (3~4일)
- 가장 단순한 객관식 + 이항대립 먼저
- 풀이 화면 + 즉시 피드백 + 라운드 반복

### Phase 5: 문항 유형 3, 4, 7 구현 (4~5일)
- 텍스트 입력 + 채점 정규화
- 단어 배열 (드래그 앤 드롭)

### Phase 6: 문항 유형 2, 6 구현 (4~5일)
- 가장 복잡한 문장 성분 선택 + 밑줄 판단
- UI 인터랙션 신경 써서 구현

### Phase 7: 학생 경험 다듬기 (3~4일)
- 홈 → 활동 카드 → 풀이 → 결과 흐름
- IndexedDB 캐싱 적용
- 배치 쓰기 적용

### Phase 8: 관리자 대시보드 (3~4일)
- 학생 목록, 학생 상세, 시도 이력 표
- 활동 생성 UI

### Phase 9: 문항 관리 (2~3일)
- 7가지 유형별 입력 폼
- CSV/JSON 일괄 업로드

### Phase 10: Cloud Functions 집계 + 배포 (2~3일)
- 통계 자동 갱신
- Firebase Hosting 배포

---

## 12. GPT 작업 의뢰 시 주의사항

1. **단계 명시**: "Phase N 작업을 시작합니다" 메시지로 시작
2. **범위 제한**: 한 메시지에 한 컴포넌트 또는 한 기능만
3. **버전 명시**: Next.js 14 App Router, Firebase v9 modular SDK
4. **변수명은 영어**: 한국어 변수명 사용 금지
5. **에러는 원문 그대로**: 빨간 에러 메시지 통째로 복붙
6. **이해 안 되면 즉시 질문**: 한 줄씩 "이게 뭐 하는 건지" 물어보기
7. **명세 우선**: GPT가 명세에 없는 임의 설계를 하려 하면 명세 수정 후 재요청

---

## 13. 참고 사항

- **유사 서비스**: 클래스카드(classcard.net)의 문법훈련 모듈 — UX 패턴 참고
- **디자인 영감**: Binance 디자인 시스템 — 단일 액센트, 플랫 서피스, 색상 대비로 위계 표현
- **차별화**: 매일 정해진 학습을 100점까지 반복하는 핵심 가치 하나에 집중
- **확장 가능 (후속)**: 단어 학습 모듈, 출결 관리, SMS/카톡 알림, 학부모 리포트

---

## 14. 로고 파일

`CANB_07_로고.png` 파일을 프로젝트의 `public/` 디렉토리에 배치 후 다음과 같이 사용:

```tsx
import Image from "next/image";
import logo from "@/public/CANB_07_로고.png";

<Image src={logo} alt="CANB English" height={40} priority />
```

- 상단 네비: 높이 32~40px
- 로그인 화면: 높이 80~120px
- 푸터: 높이 28~32px
- 변형 금지 (재컬러링, 부분 사용, 비율 변경 모두 불가)
