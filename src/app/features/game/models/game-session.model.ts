import { GameMode } from './game-mode.model';
import { GameState } from './game-state.model';
import { Player } from './player.model';

export interface GameSession {
  mode: GameMode;
  state: GameState;
  players: readonly Player[];
  currentPlayerIndex: number;
  createdAt: number;
}
