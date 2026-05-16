import type { Timestamp } from "firebase/firestore";

type QuestionBase = {
  type:
    | "multiple_choice"
    | "binary_choice"
    | "word_arrangement"
    | "sentence_construction"
    | "word_form"
    | "underline_judgment";
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

export type WordArrangementQuestion = QuestionBase & {
  type: "word_arrangement";
  hint?: string;
  words: string[];
  answer: string[];
  acceptableAnswers?: string[][];
  properNounIndices?: number[];
};

export type SentenceConstructionQuestion = QuestionBase & {
  type: "sentence_construction";
  koreanHint: string;
  givenWords: string[];
  answer: string;
  acceptableAnswers?: string[];
};

export type WordFormQuestion = QuestionBase & {
  type: "word_form";
  sentence: string;
  baseWord: string;
  hint?: string;
  answer: string;
  acceptableAnswers?: string[];
};

export type UnderlineJudgmentQuestion = QuestionBase & {
  type: "underline_judgment";
  sentence: string;
  isCorrect: boolean;
  correction?: string;
};

export type Question =
  | MultipleChoiceQuestion
  | BinaryChoiceQuestion
  | WordArrangementQuestion
  | SentenceConstructionQuestion
  | WordFormQuestion
  | UnderlineJudgmentQuestion;
