import type { Timestamp } from "firebase/firestore";

type QuestionBase = {
  type: "multiple_choice" | "binary_choice";
  prompt: string;
  explanation?: string;
  tags?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type MultipleChoiceQuestion = QuestionBase & {
  type: "multiple_choice";
  choices: string[];
  answer: number;
};

export type BinaryChoiceQuestion = QuestionBase & {
  type: "binary_choice";
  choices: [string, string];
  answer: 0 | 1;
};

export type Question = MultipleChoiceQuestion | BinaryChoiceQuestion;
