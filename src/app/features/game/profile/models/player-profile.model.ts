import { QuestionCategory } from '../../../quiz/models/question.model';

export const PROFILE_NICKNAME_MAX_LENGTH = 16;

export interface PlayerStatistics {
  totalGames: number;
  wins: number;
  losses: number;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  bestScore: number;
  bestStreak: number;
  favoriteCategory: QuestionCategory | null;
  soloGames: number;
  battleGames: number;
  categoryCounts: Readonly<Record<string, number>>;
}

export interface PlayerProfile {
  nickname: string;
  avatarId: string;
  level: number;
  experience: number;
  statistics: PlayerStatistics;
  createdAt: number;
  updatedAt: number;
  seenQuizIds: readonly number[];
  seenBattleIds: readonly string[];
  seenAchievementIds: readonly string[];
}

export interface QuizProgressFacts {
  completedAt: number;
  category: QuestionCategory;
  score: number;
  maxStreak: number;
  totalQuestions: number;
  correctCount: number;
}

export interface BattleProgressFacts {
  signature: string;
  category: QuestionCategory | null;
  score: number;
  maxStreak: number;
  questionsAnswered: number;
  correctCount: number;
  won: boolean;
  lost: boolean;
}

export interface ProfileUpdate {
  experienceGained: number;
  level: number;
  previousLevel: number;
  leveledUp: boolean;
}
