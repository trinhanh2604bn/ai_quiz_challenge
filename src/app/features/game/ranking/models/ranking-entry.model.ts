import { GameMode } from '../../models/game-mode.model';
import { QuestionCategory } from '../../../quiz/models/question.model';
import { RankTier } from './rank-tier.model';

export interface RankingEntry {
  sourceId: string;
  player: string;
  avatarId: string;
  level: number;
  experience: number;
  score: number;
  category: QuestionCategory;
  mode: GameMode;
  seasonId: string;
  recordedAt: number;
}

export interface RankingRecord {
  sourceId: string;
  player: string;
  avatarId: string;
  level: number;
  experience: number;
  score: number;
  category: QuestionCategory;
  mode: GameMode;
  recordedAt: number;
}

export interface PlayerStanding {
  rank: number;
  player: string;
  avatarId: string;
  level: number;
  experience: number;
  score: number;
  category: QuestionCategory;
  mode: GameMode;
  seasonId: string;
  tier: RankTier;
  recordedAt: number;
}
