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
  id: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  category: QuestionCategory;
  difficulty: Difficulty;
}
