import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Question } from '../../quiz/models/question.model';
import { routes } from '../../../app.routes';
import { BattlePlayer } from '../models/battle-player.model';
import { requireActiveBattle, requireCompletedBattle } from './battle.guard';
import { BattleService } from './battle.service';

describe('Battle access guards', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
  });

  it('keeps setup, the arena, and the result on their existing paths', () => {
    expect(guardPath(requireActiveBattle)).toBe('/battle/setup');
    expect(guardPath(requireCompletedBattle)).toBe('/battle/setup');

    const battle = TestBed.inject(BattleService);
    battle.createBattle([player('p1', 'Ada'), player('p2', 'Grace')], [question('q1')]);
    expect(guardAllows(requireActiveBattle)).toBeTrue();
    expect(guardPath(requireCompletedBattle)).toBe('/battle');

    battle.startBattle();
    battle.completeBattle('p1');
    expect(guardPath(requireActiveBattle)).toBe('/battle/result');
    expect(guardAllows(requireCompletedBattle)).toBeTrue();
  });
});

function guardAllows(guard: CanActivateFn): boolean {
  return guardResult(guard) === true;
}

function guardPath(guard: CanActivateFn): string {
  const result = guardResult(guard);
  return result instanceof UrlTree ? result.toString() : '';
}

function guardResult(guard: CanActivateFn): boolean | UrlTree {
  const result = TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
  if (result instanceof UrlTree || typeof result === 'boolean') {
    return result;
  }

  return false;
}

function player(id: string, name: string): BattlePlayer {
  return {
    id,
    name,
    score: 0,
    correctAnswers: 0,
    streak: 0,
    bestStreak: 0,
    answers: [],
  };
}

function question(id: string): Question {
  return {
    id,
    text: id,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    category: 'AI Fundamentals',
    difficulty: 'Easy',
  };
}
