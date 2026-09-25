import { BattleAnswer } from './battle-answer.model';

export interface BattlePlayer {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  streak: number;
  bestStreak: number;
  answers: readonly BattleAnswer[];
}
