import { GameMode } from '../../game/models/game-mode.model';

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  accuracy: number;
  completedAt: number;
  mode?: GameMode;
  avatarId?: string;
  level?: number;
}
