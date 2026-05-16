export type Activity = {
  id?: string;
  title: string;
  date: string;
  questionIds: string[];
  assignedTo: "all" | string[];
  createdAt?: unknown;
  updatedAt?: unknown;
};
