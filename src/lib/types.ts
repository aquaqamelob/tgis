export type Choice = {
  text: string;
  correct: boolean;
};

export type Question = {
  id: string;
  week: string;
  weekLabel: string;
  prompt: string;
  pickFalse: boolean;
  choices: Choice[];
};

export type QuizMode = "all" | "week" | "exam";

export type QuizSettings = {
  mode: QuizMode;
  week?: string;
  count: number;
  shuffle: boolean;
};
