export const QUESTION_CATEGORIES = [
  'AI Fundamentals',
  'Machine Learning',
  'Deep Learning',
  'Generative AI',
  'Prompt Engineering',
] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'] as const;

export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

export interface Question {
  readonly id: string;
  readonly text: string;
  readonly options: readonly [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly category: QuestionCategory;
  readonly difficulty: Difficulty;
}

export function isQuestionCategory(value: unknown): value is QuestionCategory {
  return QUESTION_CATEGORIES.some((category) => category === value);
}
