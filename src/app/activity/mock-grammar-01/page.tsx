import ActivityRunner, {
  type ActivityRunnerQuestion,
} from "@/components/ActivityRunner";

const mockQuestions: ActivityRunnerQuestion[] = [
  {
    id: "q1",
    type: "multiple_choice",
    prompt: "다음 중 어법상 올바른 문장은?",
    choices: [
      "She don't like coffee.",
      "She doesn't like coffee.",
      "She not like coffee.",
      "She isn't like coffee.",
    ],
    answer: 1,
    explanation:
      "주어 She는 3인칭 단수이므로 일반동사의 부정문은 doesn't를 사용합니다.",
  },
  {
    id: "q2",
    type: "multiple_choice",
    prompt: "빈칸에 들어갈 말로 알맞은 것은? I ___ to school yesterday.",
    choices: ["go", "goes", "went", "going"],
    answer: 2,
    explanation:
      "yesterday는 과거 시점을 나타내므로 go의 과거형 went가 알맞습니다.",
  },
  {
    id: "q3",
    type: "multiple_choice",
    prompt: "다음 중 현재완료 문장으로 알맞은 것은?",
    choices: [
      "I have finished my homework.",
      "I finished my homework tomorrow.",
      "I has finished my homework.",
      "I have finish my homework.",
    ],
    answer: 0,
    explanation:
      "현재완료는 have/has + 과거분사 형태입니다. 주어 I에는 have finished를 씁니다.",
  },
  {
    id: "q4",
    type: "binary_choice",
    prompt: "The bus {{choice}} at 7 a.m. every day.",
    choices: ["start", "starts"],
    answer: 1,
    explanation:
      "The bus는 3인칭 단수 주어이므로 현재시제 일반동사에 -s를 붙입니다.",
  },
  {
    id: "q5",
    type: "binary_choice",
    prompt: "There {{choice}} many students in the classroom.",
    choices: ["is", "are"],
    answer: 1,
    explanation:
      "many students는 복수 명사이므로 There are 형태가 알맞습니다.",
  },
];

export default function MockGrammarActivityPage() {
  return (
    <ActivityRunner activityTitle="X4 문법 훈련 01" questions={mockQuestions} />
  );
}
