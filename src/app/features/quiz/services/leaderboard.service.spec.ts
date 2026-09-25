import { TestBed } from '@angular/core/testing';
import { LeaderboardEntry } from '../models/leaderboard-entry.model';
import { LeaderboardService } from './leaderboard.service';

const STORAGE_KEY = 'ai-quiz-leaderboard';

describe('LeaderboardService', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('keeps the top 10 scores and preserves avatar and level', () => {
    const board = TestBed.inject(LeaderboardService);

    for (let index = 0; index < 11; index += 1) {
      board.addEntry(entry(`Player ${index}`, index, index));
    }

    const names = board.entries().map((item) => item.playerName);
    expect(names).toEqual([
      'Player 10',
      'Player 9',
      'Player 8',
      'Player 7',
      'Player 6',
      'Player 5',
      'Player 4',
      'Player 3',
      'Player 2',
      'Player 1',
    ]);
    expect(board.entries()[0]).toEqual(jasmine.objectContaining({ avatarId: 'nova', level: 4 }));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as LeaderboardEntry[];
    expect(stored).toHaveSize(10);
  });

  it('breaks score ties by the later completion time', () => {
    const board = TestBed.inject(LeaderboardService);
    board.addEntry(entry('Early', 40, 1));
    board.addEntry(entry('Late', 40, 9));

    expect(board.entries().map((item) => item.playerName)).toEqual(['Late', 'Early']);
  });

  it('ignores a blank name and falls back when stored JSON is invalid', () => {
    localStorage.setItem(STORAGE_KEY, '{');
    const board = TestBed.inject(LeaderboardService);

    expect(board.entries()).toEqual([]);
    board.addEntry({ ...entry(' ', 100, 1), playerName: '   ' });
    expect(board.entries()).toEqual([]);
  });

  it('loads at most 10 valid stored rows', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        ...Array.from({ length: 12 }, (_, index) => entry(`Saved ${index}`, index, index)),
        { playerName: 4, score: 99, accuracy: 1, completedAt: 1 },
      ]),
    );

    const board = TestBed.inject(LeaderboardService);
    expect(board.entries()).toHaveSize(10);
    expect(board.entries()[0].playerName).toBe('Saved 11');
    expect(board.entries().some((item) => item.playerName === 'Saved 0')).toBeFalse();
  });
});

function entry(playerName: string, score: number, completedAt: number): LeaderboardEntry {
  return {
    playerName,
    score,
    accuracy: 80,
    completedAt,
    avatarId: 'nova',
    level: 4,
  };
}
