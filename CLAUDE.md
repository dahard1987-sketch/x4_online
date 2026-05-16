# CANB English X4 Online — Claude Handoff Context

## 응답 원칙

- 사용자는 한국어를 선호한다.
- 설명은 존댓말로 한다.
- 작업 지시는 단계별로 작게 나누어 진행한다.
- 사용자가 개발 초보에 가까우므로, 명령어는 복사해서 붙여넣을 수 있게 제공한다.
- 불필요하게 기능을 앞서 구현하지 않는다.
- 기존 동작을 망가뜨리지 않는 것이 최우선이다.

## 프로젝트 개요

프로젝트명: x4_online

위치:
C:\Users\admin\Desktop\x4_online

브랜드:
CANB English

목적:
학원 학생들이 날짜별로 배정된 영어 문법 문항을 풀고, 틀린 문항을 학습한 뒤, 전체 문항 기준으로 100점을 받을 때까지 반복하는 온라인 학습 플랫폼.

기준 문서:
docs/canb_english_spec.md

이 파일을 항상 먼저 읽고 작업한다.

## 기술 스택

- Next.js App Router (v16.2.6)
- TypeScript
- Tailwind CSS v3 (tailwind.config.ts 방식 — @theme 블록과 혼용)
- Firebase Web SDK v9 modular style
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting은 나중 단계

## 현재 구현된 주요 기능

### 1. 기본 프로젝트

- Next.js 프로젝트 생성 완료
- Tailwind 설정 완료
- CANB 로고 public/canb-logo.png 사용
- docs/canb_english_spec.md 추가 완료
- GitHub repository 연결 완료
- GitHub 원격 저장소:
  https://github.com/dahard1987-sketch/x4_online.git

### 2. 랜딩페이지

- / 는 /login으로 즉시 redirect (랜딩페이지 없음)
- src/app/page.tsx: redirect("/login") 단 한 줄

### 3. Firebase Auth

- Firebase 프로젝트: x4-online
- .env.local에 Firebase Web App config 입력 완료
- .env.local은 .gitignore에 의해 Git에 올라가지 않음
- src/lib/firebase.ts에서 Firebase 초기화
- auth export 사용
- /login에서 이메일/비밀번호 로그인 작동 확인 완료
- 로그인 성공 시 /dashboard로 이동
- /dashboard에서 로그아웃 가능

중요:
.env.local을 절대 읽거나 출력하거나 수정하지 않는다.
Firebase config 값을 코드에 하드코딩하지 않는다.

### 4. 학생 대시보드

- /dashboard 구현
- Firestore activities를 읽어 학생 활동 카드 표시
- assignedTo: "all" 활동만 사용
- attempts를 읽어 활동 상태 표시
- 활동 카드에서 /activity/[activityId]로 이동
- 대시보드 하단에 관리자 도구 링크 있음

### 5. 관리자 문항 입력

- /admin/questions/new 구현
- /admin/questions 구현 (미리보기 카드 형태)
- Firestore questions 컬렉션에 저장 가능
- 현재 지원 유형:
  - multiple_choice
  - binary_choice
  - word_arrangement
  - sentence_construction
- 관리자 문항 입력 UI는 컴팩트한 카드 에디터 스타일
- 문항 목록(/admin/questions)은 raw 데이터 노출 없이 미리보기 형태로만 표시

### 6. 관리자 활동 생성

- /admin/activities/new 구현
- /admin/activities 구현
- Firestore questions에서 문항 목록을 읽음
- 여러 문항을 선택해 activities 컬렉션에 저장
- activity 구조:
  - title
  - date
  - questionIds
  - assignedTo: "all"
  - createdAt
  - updatedAt

중요:
하나의 activity는 한 유형만 담는 구조가 아니다.
여러 문항 유형이 섞인 문제 세트여야 한다.

### 7. 학생 문제풀이

- /activity/[activityId] 구현
- activity.questionIds를 기준으로 Firestore questions를 불러와 풀이
- 현재 지원 유형:
  - multiple_choice
  - binary_choice
  - word_arrangement
  - sentence_construction
- ActivityRunner는 단일 유형 전용이 아님
- Question union 배열을 받아 question.type에 따라 렌더링 분기
- 마지막 문제의 제출 버튼은 "답안 제출" (녹색 button-correct 스타일)

### 8. 반복 학습 알고리즘

현재 반드시 유지해야 하는 알고리즘:

1. Full Round 1
   - activity에 포함된 모든 문항을 유형 구분 없이 섞어서 출제
   - 점수 계산
   - 전체 문항 기준 100점이면 완료
   - 100점 미만이면 틀린 문항 목록 생성

2. Review Round
   - 직전 Full Round에서 틀린 문항만 유형 구분 없이 섞어서 출제
   - 이 단계는 오답 학습용
   - 점수 산정용이 아님
   - Review Round에서 다 맞혔다고 완료 처리하지 않음

3. Full Retry Round
   - 다시 activity 전체 문항을 유형 구분 없이 섞어서 출제
   - 전체 문항 기준 100점이면 완료
   - 아니면 다시 Review Round로 이동

4. 전체 문항 기준 100점일 때만 활동 완료

점수:
- firstRoundScore는 첫 번째 Full Round 점수
- bestScore는 Full Round들 중 최고점
- finalScore는 완료 시 마지막 Full Round 점수
- review round 점수는 bestScore/finalScore에 반영하지 않음

### 9. 랜덤화 규칙

문항 순서:
- Full Round마다 전체 문항을 셔플
- Review Round마다 오답 문항을 셔플
- 한 라운드가 시작된 뒤에는 문항 순서가 고정되어야 함
- 렌더링 때마다 바뀌면 안 됨

선택지 순서:
- multiple_choice choices는 화면 표시 시 랜덤 셔플
- binary_choice choices도 화면 표시 시 랜덤 셔플
- 같은 문제를 보는 동안 선택지 순서가 고정되어야 함
- 정답 판정은 display index가 아니라 originalIndex 기준
- question.choices.map을 직접 렌더링하면 안 됨
- shuffledChoices의 originalIndex로 정답 판정

binary_choice:
- prompt 안의 {{choice}} 위치에 선택지가 inline으로 들어가야 함
- 예:
  The bus ( start / starts ) at 7 a.m. every day.

word_arrangement:
- words는 라운드마다 랜덤 셔플, 같은 문제 푸는 동안 고정
- selectedWordTokens는 originalIndex로 중복 단어 대응
- 정답 판정은 대소문자·terminal punctuation 무시

sentence_construction:
- givenWords는 pill 형태로 표시 (셔플 없음)
- 학생은 textarea에 직접 문장 입력
- 정답 판정: 대소문자·terminal punctuation·공백 정규화 후 비교
- src/lib/sentenceConstruction.ts: compareSentenceConstructionAnswer

### 10. attempts 저장

- 활동 완료 시 Firestore attempts 컬렉션에 저장
- studentId는 Firebase Auth currentUser.uid
- studentEmail은 currentUser.email
- activityId, activityTitle 저장
- firstRoundScore, bestScore, finalScore 저장
- totalFullRounds, totalReviewRounds 저장
- durationSec 저장
- roundSummaries 저장
- details 저장
- 중복 저장 방지 필요

### 11. 관리자 결과 확인

- /admin/attempts 구현
- attempts 컬렉션을 읽어 학습 결과 확인
- 요약 카드, 필터, 결과 테이블, 상세 패널 구현
- 아직 students/admins 권한 분리는 하지 않음

### 12. UI/UX

- Pretendard 폰트 CDN으로 로드 (src/app/layout.tsx)
- body에 word-break: keep-all, overflow-wrap: break-word (한국어 줄바꿈)
- 문제 풀이 폰트(text-question-body): 22px
- 선택지 버튼: text-base (16px)
- 마지막 문항 제출 버튼: button-correct (녹색) + "답안 제출" 텍스트
- 모든 페이지의 CANB 로고 클릭 시 /dashboard로 이동

## 아직 구현하지 않은 것

- word_form 문항 유형
- sentence_parsing 문항 유형
- underline_judgment 문항 유형
- students 컬렉션
- admins 컬렉션
- 관리자/학생 권한 분리
- Cloud Functions
- 통계 aggregate 문서
- Firebase Hosting 배포
- 학부모 리포트
- CSV 일괄 업로드

## 지금 바로 이어갈 작업

완료된 Phase:
- Phase 9: word_arrangement (단어 배열) 유형 구현 완료
- Phase 10: sentence_construction (문장 완성) 유형 구현 완료
- UX 개선: 폰트 확대, 로고 링크, 마지막 문제 버튼, 미리보기 문항 목록

다음 작업은 사용자가 별도로 지시한다.

## 작업 금지 사항

- .env.local 읽기/수정/출력 금지
- Firebase config 하드코딩 금지
- Firestore 컬렉션 이름 변경 금지
- activities 구조 변경 금지
- attempts 구조 변경 금지
- 기존 multiple_choice, binary_choice, word_arrangement, sentence_construction 기능 훼손 금지
- 관리자 권한 분리 구현 금지
- students/admins 컬렉션 구현 금지
- Cloud Functions 구현 금지
- 외부 UI 라이브러리 추가 금지
- word_form, sentence_parsing, underline_judgment 유형은 아직 구현 금지

## 자주 쓰는 명령어

개발 서버:
npm.cmd run dev

빌드 테스트:
npm.cmd run build

Git 저장:
git status
git add .
git commit -m "message"
git push

현재 프로젝트 위치:
C:\Users\admin\Desktop\x4_online
