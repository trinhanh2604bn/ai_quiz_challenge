import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { routes } from '../../../../app.routes';
import { Question } from '../../../quiz/models/question.model';
import { LeaderboardService } from '../../../quiz/services/leaderboard.service';
import { AchievementService } from '../../achievements/services/achievement.service';
import { BattleAnswer } from '../../models/battle-answer.model';
import { BattleSession } from '../../models/battle-session.model';
import { quizExperience } from '../data/progression.data';
import { QuizProgressFacts } from '../models/player-profile.model';
import { requireNoProfile, requireProfile } from './profile.guard';
import { PROFILE_STORAGE_KEY, ProfileService, battleProgressFacts } from './profile.service';

describe('ProfileService', () => {
  beforeEach(() => {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem('ai-quiz-leaderboard');
    localStorage.removeItem('ai-quiz-achievements');
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
  });

  afterEach(() => {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem('ai-quiz-leaderboard');
    localStorage.removeItem('ai-quiz-achievements');
    TestBed.resetTestingModule();
  });

  it('creates a profile and reloads it from localStorage', () => {
    const created = TestBed.inject(ProfileService).createProfile('  Ada  ', 'atlas');

    expect(created?.nickname).toBe('Ada');
    expect(created?.avatarId).toBe('atlas');
    expect(created?.level).toBe(1);
    expect(created?.experience).toBe(0);
    expect(created?.statistics.totalGames).toBe(0);
    expect(created?.createdAt).toBe(created?.updatedAt);
    expect(localStorage.getItem(PROFILE_STORAGE_KEY)).toContain('"nickname":"Ada"');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const reloaded = TestBed.inject(ProfileService).profile();

    expect(reloaded?.nickname).toBe('Ada');
    expect(reloaded?.avatarId).toBe('atlas');
    expect(reloaded?.level).toBe(1);
  });

  it('rejects a blank nickname, an unknown avatar, and a second profile', () => {
    const service = TestBed.inject(ProfileService);

    expect(service.createProfile('   ', 'nova')).toBeNull();
    expect(service.createProfile('Ada', 'missing')).toBeNull();
    expect(service.createProfile('A'.repeat(17), 'nova')).toBeNull();
    expect(service.profile()).toBeNull();

    expect(service.createProfile('Ada', 'nova')?.nickname).toBe('Ada');
    expect(service.createProfile('Grace', 'orbit')).toBeNull();
    expect(service.profile()?.nickname).toBe('Ada');
  });

  it('treats invalid stored JSON as no profile', () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, '{');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });

    expect(TestBed.inject(ProfileService).profile()).toBeNull();

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ nickname: '', avatarId: 'nova' }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });

    expect(TestBed.inject(ProfileService).profile()).toBeNull();
  });

  it('does not record progression when no profile exists', () => {
    const service = TestBed.inject(ProfileService);

    expect(service.recordQuizCompletion(quizFacts())).toBeNull();
    expect(
      service.recordBattleCompletion({
        signature: 'battle-1',
        category: 'Deep Learning',
        score: 40,
        maxStreak: 2,
        questionsAnswered: 4,
        correctCount: 4,
        won: true,
        lost: false,
      }),
    ).toBeNull();
    expect(service.recordAchievementUnlocks(['first-step'])).toBeNull();
    expect(service.profile()).toBeNull();
    expect(localStorage.getItem(PROFILE_STORAGE_KEY)).toBeNull();
  });

  it('awards quiz XP, levels up, and updates solo statistics once', () => {
    const service = TestBed.inject(ProfileService);
    service.createProfile('Ada', 'nova');

    const first = service.recordQuizCompletion(
      quizFacts({ correctCount: 8, totalQuestions: 10, score: 80, maxStreak: 4 }),
    );
    expect(quizExperience(10, 8)).toBe(130);
    expect(first?.experienceGained).toBe(130);
    expect(first?.level).toBe(2);
    expect(first?.previousLevel).toBe(1);
    expect(first?.leveledUp).toBeTrue();

    const perfect = service.recordQuizCompletion(
      quizFacts({
        completedAt: 2,
        category: 'Machine Learning',
        correctCount: 10,
        totalQuestions: 10,
        score: 240,
        maxStreak: 10,
      }),
    );
    expect(quizExperience(10, 10)).toBe(250);
    expect(perfect?.experienceGained).toBe(250);
    expect(perfect?.level).toBe(4);
    expect(perfect?.leveledUp).toBeTrue();
    expect(service.recordQuizCompletion(quizFacts({ completedAt: 2 }))).toBeNull();

    const stats = service.profile()?.statistics;
    expect(service.profile()?.experience).toBe(380);
    expect(localStorage.getItem(PROFILE_STORAGE_KEY)).toContain('"experience":380');
    expect(stats?.soloGames).toBe(2);
    expect(stats?.battleGames).toBe(0);
    expect(stats?.totalGames).toBe(2);
    expect(stats?.wins).toBe(0);
    expect(stats?.losses).toBe(0);
    expect(stats?.questionsAnswered).toBe(20);
    expect(stats?.correctAnswers).toBe(18);
    expect(stats?.accuracy).toBe(90);
    expect(stats?.bestScore).toBe(240);
    expect(stats?.bestStreak).toBe(10);
    expect(stats?.favoriteCategory).toBe('AI Fundamentals');
  });

  it('switches the favorite category only when another category is played more', () => {
    const service = TestBed.inject(ProfileService);
    service.createProfile('Ada', 'nova');
    service.recordQuizCompletion(quizFacts({ completedAt: 1, category: 'AI Fundamentals' }));
    service.recordQuizCompletion(quizFacts({ completedAt: 2, category: 'Machine Learning' }));

    expect(service.profile()?.statistics.favoriteCategory).toBe('AI Fundamentals');

    service.recordQuizCompletion(quizFacts({ completedAt: 3, category: 'Machine Learning' }));

    expect(service.profile()?.statistics.favoriteCategory).toBe('Machine Learning');
  });

  it('records a battle win, loss, and draw for the local player without repeating a signature', () => {
    const service = TestBed.inject(ProfileService);
    service.createProfile('Ada', 'orbit');

    const win = service.recordBattleCompletion({
      signature: 'win',
      category: 'Deep Learning',
      score: 40,
      maxStreak: 3,
      questionsAnswered: 4,
      correctCount: 4,
      won: true,
      lost: false,
    });
    expect(win?.experienceGained).toBe(120);
    expect(win?.level).toBe(2);
    expect(win?.leveledUp).toBeTrue();

    const loss = service.recordBattleCompletion({
      signature: 'loss',
      category: 'Deep Learning',
      score: 10,
      maxStreak: 1,
      questionsAnswered: 4,
      correctCount: 1,
      won: false,
      lost: true,
    });
    expect(loss?.experienceGained).toBe(10);
    expect(loss?.leveledUp).toBeFalse();

    const draw = service.recordBattleCompletion({
      signature: 'draw',
      category: null,
      score: 20,
      maxStreak: 2,
      questionsAnswered: 2,
      correctCount: 2,
      won: false,
      lost: false,
    });
    expect(draw?.experienceGained).toBe(20);
    expect(service.recordBattleCompletion({
      signature: 'draw',
      category: 'Deep Learning',
      score: 99,
      maxStreak: 9,
      questionsAnswered: 10,
      correctCount: 10,
      won: true,
      lost: false,
    })).toBeNull();

    const stats = service.profile()?.statistics;
    expect(stats?.battleGames).toBe(3);
    expect(stats?.soloGames).toBe(0);
    expect(stats?.totalGames).toBe(3);
    expect(stats?.wins).toBe(1);
    expect(stats?.losses).toBe(1);
    expect(stats?.questionsAnswered).toBe(10);
    expect(stats?.correctAnswers).toBe(7);
    expect(stats?.accuracy).toBe(70);
    expect(stats?.bestScore).toBe(40);
    expect(stats?.bestStreak).toBe(3);
    expect(stats?.favoriteCategory).toBe('Deep Learning');
    expect(service.profile()?.experience).toBe(150);
  });

  it('reads a battle win from player 1 and a loss when player 2 scores higher', () => {
    const questions = [sampleQuestion()];
    const win = battleProgressFacts(
      session(50, 10, [answer(true)], [answer(false)]),
      'sig',
    );
    const loss = battleProgressFacts(
      session(10, 50, [answer(false)], [answer(true)]),
      'sig',
    );

    expect(win.won).toBeTrue();
    expect(win.lost).toBeFalse();
    expect(win.score).toBe(50);
    expect(win.questionsAnswered).toBe(1);
    expect(win.category).toBe('AI Fundamentals');
    expect(loss.won).toBeFalse();
    expect(loss.lost).toBeTrue();
    expect(questions[0].category).toBe('AI Fundamentals');
  });

  it('awards achievement XP once and leaves achievement unlock rules in place', () => {
    const profiles = TestBed.inject(ProfileService);
    const achievements = TestBed.inject(AchievementService);
    profiles.createProfile('Ada', 'spark');

    const unlocked = achievements.recordQuizCompletion({
      completedAt: 1,
      score: 10,
      accuracy: 10,
      maxStreak: 1,
      category: 'AI Fundamentals',
      difficulty: 'Easy',
      totalQuestions: 10,
      correctCount: 1,
    });
    profiles.recordQuizCompletion(quizFacts());
    const award = profiles.recordAchievementUnlocks(unlocked.map((item) => item.id));

    expect(unlocked.map((item) => item.id)).toEqual(['first-step']);
    expect(award?.experienceGained).toBe(25);
    expect(profiles.profile()?.experience).toBe(85);
    expect(achievements.unlocked().map((item) => item.id)).toEqual(['first-step']);
    expect(profiles.recordAchievementUnlocks(['first-step', 'first-step'])).toBeNull();
    expect(achievements.recordQuizCompletion({
      completedAt: 1,
      score: 10,
      accuracy: 10,
      maxStreak: 1,
      category: 'AI Fundamentals',
      difficulty: 'Easy',
      totalQuestions: 10,
      correctCount: 1,
    })).toEqual([]);
    expect(profiles.profile()?.experience).toBe(85);
  });

  it('keeps leaderboard ranking by score when avatar and level differ', () => {
    const board = TestBed.inject(LeaderboardService);

    board.addEntry({
      playerName: 'Newcomer',
      score: 200,
      accuracy: 100,
      completedAt: 1,
      avatarId: 'nova',
      level: 1,
    });
    board.addEntry({
      playerName: 'Veteran',
      score: 50,
      accuracy: 40,
      completedAt: 9,
      avatarId: 'orbit',
      level: 9,
    });

    expect(board.entries().map((entry) => entry.playerName)).toEqual(['Newcomer', 'Veteran']);
    expect(board.entries().map((entry) => entry.level)).toEqual([1, 9]);
  });

  it('sends a missing profile to creation and an existing profile away from it', () => {
    expect(guardPath(requireProfile)).toBe('/profile/create');
    expect(guardAllows(requireNoProfile)).toBeTrue();

    TestBed.inject(ProfileService).createProfile('Ada', 'pixel');

    expect(guardAllows(requireProfile)).toBeTrue();
    expect(guardPath(requireNoProfile)).toBe('/');
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

function quizFacts(overrides: Partial<QuizProgressFacts> = {}): QuizProgressFacts {
  return {
    completedAt: 1,
    category: 'AI Fundamentals',
    score: 10,
    maxStreak: 1,
    totalQuestions: 10,
    correctCount: 1,
    ...overrides,
  };
}

function session(
  localScore: number,
  opponentScore: number,
  localAnswers: BattleAnswer[],
  opponentAnswers: BattleAnswer[],
): BattleSession {
  return {
    players: [
      {
        id: 'player-1',
        name: 'Ada',
        score: localScore,
        correctAnswers: localAnswers.filter((answer) => answer.isCorrect).length,
        streak: 0,
        bestStreak: 1,
        answers: localAnswers,
      },
      {
        id: 'player-2',
        name: 'Grace',
        score: opponentScore,
        correctAnswers: opponentAnswers.filter((answer) => answer.isCorrect).length,
        streak: 0,
        bestStreak: 1,
        answers: opponentAnswers,
      },
    ],
    questions: [sampleQuestion()],
    currentQuestionIndex: 0,
    currentPlayerIndex: 0,
    state: 'completed',
    winner: null,
  };
}

function answer(correct: boolean): BattleAnswer {
  return {
    questionId: 'q-1',
    selectedAnswer: correct ? 0 : 1,
    correctAnswer: 0,
    isCorrect: correct,
    responseTime: 10,
  };
}

function sampleQuestion(): Question {
  return {
    id: 'q-1',
    text: 'Prompt',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    category: 'AI Fundamentals',
    difficulty: 'Easy',
  };
}
