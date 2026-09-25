import { Injectable, signal } from '@angular/core';
import { GameMode } from '../models/game-mode.model';
import { GameSession } from '../models/game-session.model';
import { GameState } from '../models/game-state.model';
import { Player } from '../models/player.model';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly modeState = signal<GameMode | null>(null);
  private readonly flowState = signal<GameState>('home');
  private readonly sessionState = signal<GameSession | null>(null);

  readonly mode = this.modeState.asReadonly();
  readonly state = this.flowState.asReadonly();
  readonly session = this.sessionState.asReadonly();

  setGameMode(mode: GameMode): void {
    this.modeState.set(mode);
    const session = this.sessionState();
    if (session) {
      this.sessionState.set({ ...session, mode });
    }
  }

  changeState(state: GameState): void {
    this.flowState.set(state);
    const session = this.sessionState();
    if (session) {
      this.sessionState.set({ ...session, state });
    }
  }

  createSession(mode: GameMode, players: readonly Player[]): void {
    const session: GameSession = {
      mode,
      state: this.flowState(),
      players: players.map((player) => ({
        ...player,
        answers: [...player.answers],
      })),
      currentPlayerIndex: 0,
      createdAt: Date.now(),
    };

    this.modeState.set(mode);
    this.sessionState.set(session);
  }

  resetGame(): void {
    this.modeState.set(null);
    this.flowState.set('home');
    this.sessionState.set(null);
  }
}
