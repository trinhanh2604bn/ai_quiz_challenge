import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from '../../../../app.routes';
import { Question } from '../../../quiz/models/question.model';
import { LeaderboardService } from '../../../quiz/services/leaderboard.service';
import { BattlePlayer } from '../../models/battle-player.model';
import { BattleService } from '../../services/battle.service';
import { GameService } from '../../services/game.service';
import {
  accuracyPercent,
  BattleResultComponent,
  calculateWinner,
} from './battle-result';

const STORAGE_KEY = 'ai-quiz-leaderboard';

describe('Battle result', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
  });

  it('names the higher score as the winner and ignores accuracy and streak', () => {
    const ada = battlePlayer('player-1', 'Ada', { score: 50, correctAnswers: 2, bestStreak: 1 });
    const grace = battlePlayer('player-2', 'Grace', {
      score: 30,
      correctAnswers: 8,
      bestStreak: 6,
    });

    expect(calculateWinner([ada, grace])?.id).toBe('player-1');
    expect(calculateWinner([grace, ada])?.id).toBe('player-1');

    const fixture = showResult([ada, grace]);
    expect(textOf(fixture)).toContain('Ada wins.');
    expect(textOf(fixture)).toContain('Score');
    expect(textOf(fixture)).toContain('50');
    expect(textOf(fixture)).toContain('Correct answers');
    expect(textOf(fixture)).toContain('2 / 10');
    expect(textOf(fixture)).toContain('Accuracy');
    expect(textOf(fixture)).toContain('20%');
    expect(textOf(fixture)).toContain('8 / 10');
    expect(textOf(fixture)).toContain('80%');
    expect(textOf(fixture)).toContain('Best streak');
    expect(textOf(fixture)).toContain('6');
    expect(fixture.nativeElement.querySelector('.is-winner')?.textContent).toContain('Ada');
    fixture.destroy();
  });

  it('shows a draw when the scores are equal', () => {
    const ada = battlePlayer('player-1', 'Ada', { score: 40, correctAnswers: 4, bestStreak: 4 });
    const grace = battlePlayer('player-2', 'Grace', { score: 40, correctAnswers: 2, bestStreak: 1 });

    expect(calculateWinner([ada, grace])).toBeNull();
    expect(accuracyPercent(4, 10)).toBe(40);
    expect(accuracyPercent(0, 0)).toBe(0);

    const fixture = showResult([ada, grace]);
    expect(textOf(fixture)).toContain('Draw');
    expect(textOf(fixture)).not.toContain('wins');
    expect(fixture.nativeElement.querySelector('.is-winner')).toBeNull();
    fixture.destroy();
  });

  it('saves both players on the leaderboard and can open that list', () => {
    const fixture = showResult([
      battlePlayer('player-1', 'Ada', { score: 50, correctAnswers: 5, bestStreak: 3 }),
      battlePlayer('player-2', 'Grace', { score: 20, correctAnswers: 2, bestStreak: 2 }),
    ]);

    const entries = TestBed.inject(LeaderboardService).entries();
    expect(entries.map((entry) => entry.playerName)).toEqual(['Ada', 'Grace']);
    expect(entries.map((entry) => entry.score)).toEqual([50, 20]);
    expect(entries.map((entry) => entry.accuracy)).toEqual([50, 20]);
    expect(entries.every((entry) => entry.mode === 'two-player')).toBeTrue();
    expect(entries[0].completedAt).toBe(entries[1].completedAt);

    clickButton(fixture, 'Leaderboard');
    const board = fixture.nativeElement.querySelector('app-leaderboard');
    expect(board).not.toBeNull();
    expect(board.textContent).toContain('Ada');
    expect(board.textContent).toContain('Grace');
    expect(board.textContent).toContain('Two players');
    fixture.destroy();
  });

  it('returns to battle setup on play again', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const game = TestBed.inject(GameService);
    game.setGameMode('two-player');
    game.changeState('result');
    const fixture = showResult([
      battlePlayer('player-1', 'Ada', { score: 10, correctAnswers: 1, bestStreak: 1 }),
      battlePlayer('player-2', 'Grace', { score: 0, correctAnswers: 0, bestStreak: 0 }),
    ]);

    clickButton(fixture, 'Play again');

    expect(TestBed.inject(BattleService).session()).toBeNull();
    expect(game.mode()).toBe('two-player');
    expect(navigate).toHaveBeenCalledWith(['/battle/setup']);
    fixture.destroy();
  });

  it('resets the game and returns home on exit', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const game = TestBed.inject(GameService);
    game.setGameMode('two-player');
    game.changeState('result');
    const fixture = showResult([
      battlePlayer('player-1', 'Ada', { score: 10, correctAnswers: 1, bestStreak: 1 }),
      battlePlayer('player-2', 'Grace', { score: 0, correctAnswers: 0, bestStreak: 0 }),
    ]);

    clickButton(fixture, 'Exit');

    expect(TestBed.inject(BattleService).session()).toBeNull();
    expect(game.mode()).toBeNull();
    expect(game.state()).toBe('home');
    expect(game.session()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/']);
    fixture.destroy();
  });

  it('keeps stored single-player rankings when mode is absent', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { playerName: 'Solo', score: 80, accuracy: 90, completedAt: 10 },
        { playerName: 'Earlier', score: 80, accuracy: 70, completedAt: 5 },
        { playerName: 'Low', score: 10, accuracy: 20, completedAt: 9, mode: 'not-a-mode' },
      ]),
    );

    const board = TestBed.inject(LeaderboardService);
    board.addEntry({ playerName: ' ', score: 100, accuracy: 100, completedAt: 50 });
    board.addEntry({
      playerName: 'New',
      score: 70,
      accuracy: 70,
      completedAt: 11,
    });

    expect(board.entries().map((entry) => entry.playerName)).toEqual(['Solo', 'Earlier', 'New', 'Low']);
    expect(board.entries()[0].mode).toBeUndefined();
    expect(board.entries()[3].mode).toBeUndefined();
    expect(board.entries().some((entry) => entry.playerName.trim().length === 0)).toBeFalse();
  });
});

function showResult(
  players: readonly [BattlePlayer, BattlePlayer],
): ComponentFixture<BattleResultComponent> {
  const battle = TestBed.inject(BattleService);
  battle.createBattle(players, questions(10));
  battle.startBattle();
  battle.completeBattle(null);
  const fixture = TestBed.createComponent(BattleResultComponent);
  fixture.detectChanges();
  return fixture;
}

function questions(count: number): Question[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `q-${index + 1}`,
    text: `Prompt ${index + 1}`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    category: 'AI Fundamentals',
    difficulty: 'Easy',
  }));
}

function battlePlayer(
  id: string,
  name: string,
  stats: { score: number; correctAnswers: number; bestStreak: number },
): BattlePlayer {
  return {
    id,
    name,
    score: stats.score,
    correctAnswers: stats.correctAnswers,
    streak: 0,
    bestStreak: stats.bestStreak,
    answers: [],
  };
}

function textOf(fixture: ComponentFixture<unknown>): string {
  return fixture.nativeElement.textContent ?? '';
}

function clickButton(fixture: ComponentFixture<unknown>, label: string): void {
  const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
  const match = Array.from(buttons).find((button) => button.textContent?.trim() === label);
  if (!match) {
    throw new Error(`Missing ${label} button`);
  }
  match.click();
  fixture.detectChanges();
}
