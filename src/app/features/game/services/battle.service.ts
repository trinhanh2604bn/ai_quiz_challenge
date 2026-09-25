import { Injectable, computed, signal } from '@angular/core';
import { Question } from '../../quiz/models/question.model';
import { BattleAnswer } from '../models/battle-answer.model';
import { BattlePlayer } from '../models/battle-player.model';
import { BattleSession } from '../models/battle-session.model';
import { BattleState } from '../models/battle-state.model';

/**
 * Owns the two-player session: who is active, which question is current,
 * and the lifecycle below. Answer checks and points stay outside; recordAnswer
 * only stores the result it is given on the active player.
 *
 * waiting --startBattle--> player-turn
 * player-turn --switchPlayer--> transition
 * player-turn --nextQuestion--> transition
 * transition --startBattle--> player-turn
 * player-turn | transition --completeBattle--> completed
 */
@Injectable({
  providedIn: 'root',
})
export class BattleService {
  private readonly sessionState = signal<BattleSession | null>(null);

  readonly session = this.sessionState.asReadonly();
  readonly state = computed<BattleState | null>(() => this.sessionState()?.state ?? null);
  readonly currentPlayer = computed(() => {
    const session = this.sessionState();
    if (!session) {
      return null;
    }

    return session.players[session.currentPlayerIndex];
  });
  readonly currentQuestion = computed(() => {
    const session = this.sessionState();
    if (!session) {
      return null;
    }

    return session.questions[session.currentQuestionIndex] ?? null;
  });

  createBattle(
    players: readonly [BattlePlayer, BattlePlayer],
    questions: readonly Question[] = [],
  ): void {
    const session: BattleSession = {
      players: [copyPlayer(players[0]), copyPlayer(players[1])],
      questions: [...questions],
      currentQuestionIndex: 0,
      currentPlayerIndex: 0,
      state: 'waiting',
      winner: null,
    };

    this.sessionState.set(session);
  }

  startBattle(): void {
    const session = this.sessionState();
    if (!session || (session.state !== 'waiting' && session.state !== 'transition')) {
      return;
    }

    this.sessionState.set({ ...session, state: 'player-turn' });
  }

  switchPlayer(): void {
    const session = this.sessionState();
    if (!session || (session.state !== 'player-turn' && session.state !== 'transition')) {
      return;
    }

    this.sessionState.set({
      ...session,
      currentPlayerIndex: session.currentPlayerIndex === 0 ? 1 : 0,
      state: 'transition',
    });
  }

  nextQuestion(): void {
    const session = this.sessionState();
    if (!session || session.state !== 'player-turn') {
      return;
    }

    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex >= session.questions.length) {
      return;
    }

    this.sessionState.set({
      ...session,
      currentQuestionIndex: nextIndex,
      state: 'transition',
    });
  }

  recordAnswer(
    answer: BattleAnswer,
    stats: Pick<BattlePlayer, 'score' | 'correctAnswers' | 'streak' | 'bestStreak'>,
  ): void {
    const session = this.sessionState();
    if (!session || session.state !== 'player-turn') {
      return;
    }

    const index = session.currentPlayerIndex;
    const player = session.players[index];
    if (player.answers.some((existing) => existing.questionId === answer.questionId)) {
      return;
    }

    const updated: BattlePlayer = {
      ...player,
      score: stats.score,
      correctAnswers: stats.correctAnswers,
      streak: stats.streak,
      bestStreak: stats.bestStreak,
      answers: [...player.answers, { ...answer }],
    };
    const players: [BattlePlayer, BattlePlayer] = [session.players[0], session.players[1]];
    players[index] = updated;
    this.sessionState.set({ ...session, players });
  }

  completeBattle(winnerId: string | null = null): void {
    const session = this.sessionState();
    if (!session || (session.state !== 'player-turn' && session.state !== 'transition')) {
      return;
    }

    const winner =
      winnerId === null
        ? null
        : (session.players.find((player) => player.id === winnerId) ?? undefined);

    if (winner === undefined) {
      return;
    }

    this.sessionState.set({
      ...session,
      state: 'completed',
      winner,
    });
  }

  resetBattle(): void {
    this.sessionState.set(null);
  }
}

function copyPlayer(player: BattlePlayer): BattlePlayer {
  return {
    ...player,
    answers: player.answers.map((answer) => ({ ...answer })),
  };
}
