import { GameMode } from '../../game/models/game-mode.model';

export interface LeaderboardEntry {
  readonly playerName: string;
  readonly score: number;
  readonly accuracy: number;
  readonly completedAt: number;
  readonly mode?: GameMode;
  readonly avatarId?: string;
  readonly level?: number;
}
