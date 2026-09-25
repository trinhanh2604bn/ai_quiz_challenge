import { Difficulty, QuestionCategory } from '../../../quiz/models/question.model';

export const ACHIEVEMENT_CONDITION_TYPES = [
  'quizzes-completed',
  'categories-played',
  'accuracy-reached',
  'score-reached',
  'perfect-score',
  'streak-reached',
  'battles-completed',
  'battles-won',
  'hard-quizzes-completed',
] as const;

export type AchievementConditionType = (typeof ACHIEVEMENT_CONDITION_TYPES)[number];

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  conditionType: AchievementConditionType;
  target: number;
}

export interface Achievement extends AchievementDefinition {
  unlocked: boolean;
  unlockedAt: number | null;
}

export interface AchievementProgress {
  quizzesCompleted: number;
  categories: readonly QuestionCategory[];
  bestScore: number;
  bestAccuracy: number;
  perfectCount: number;
  bestStreak: number;
  battlesCompleted: number;
  battlesWon: number;
  hardQuizzesCompleted: number;
  seenQuizIds: readonly number[];
  seenBattleIds: readonly string[];
}

export interface AchievementState {
  unlockedAt: Readonly<Record<string, number>>;
  progress: AchievementProgress;
}

export interface QuizCompletionFacts {
  completedAt: number;
  score: number;
  accuracy: number;
  maxStreak: number;
  category: QuestionCategory;
  difficulty: Difficulty;
  totalQuestions: number;
  correctCount: number;
}

export interface BattleAchievementFacts {
  signature: string;
  won: boolean;
  scores: readonly number[];
  bestStreak: number;
}
