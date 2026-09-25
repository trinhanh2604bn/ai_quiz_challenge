import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { routes } from '../../../../app.routes';
import { ResultScreenComponent } from '../../../quiz/components/result-screen/result-screen';
import { QuizPageComponent } from '../../../quiz/components/quiz-page/quiz-page';
import { Question, QuestionCategory } from '../../../quiz/models/question.model';
import { QuizService } from '../../../quiz/services/quiz.service';
import { BattleResultComponent } from '../../components/battle-result/battle-result';
import { GameHomeComponent } from '../../components/game-home/game-home';
import { BattlePlayer } from '../../models/battle-player.model';
import { BattleService } from '../../services/battle.service';
import {
  ACHIEVEMENT_POPUP_MS,
  AchievementPopupComponent,
} from '../components/achievement-popup/achievement-popup';
import { AchievementScreenComponent } from '../components/achievement-screen/achievement-screen';
import { Achievement, QuizCompletionFacts } from '../models/achievement.model';
import { AudioService } from '../../audio/services/audio.service';
import { ACHIEVEMENT_STORAGE_KEY, AchievementService } from './achievement.service';

describe('AchievementService', () => {
  beforeEach(() => {
    localStorage.removeItem(ACHIEVEMENT_STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), AchievementService],
    });
    const audio = TestBed.inject(AudioService);
    spyOn(audio, 'playAchievementSound');
    spyOn(audio, 'playButtonClick');
    spyOn(audio, 'playMenuMusic');
    spyOn(audio, 'playSelection');
    spyOn(audio, 'playQuizMusic');
    spyOn(audio, 'playCorrectSound');
    spyOn(audio, 'playWrongSound');
    spyOn(audio, 'playTimeoutSound');
    spyOn(audio, 'playCompleteSound');
    spyOn(audio, 'playWarningSound');
  });

  afterEach(() => {
    localStorage.removeItem(ACHIEVEMENT_STORAGE_KEY);
    TestBed.resetTestingModule();
  });

  it('unlocks First Step when the first solo quiz is completed', () => {
    const service = TestBed.inject(AchievementService);

    const unlocked = service.recordQuizCompletion(quizFacts());

    expect(ids(unlocked)).toEqual(['first-step']);
    expect(service.unlocked().map((item) => item.id)).toContain('first-step');
    expect(service.locked().map((item) => item.id)).not.toContain('first-step');
  });

  it('unlocks a perfect solo quiz, including score and streak milestones', () => {
    const service = TestBed.inject(AchievementService);

    const unlocked = service.recordQuizCompletion(
      quizFacts({
        score: 240,
        accuracy: 100,
        maxStreak: 10,
        correctCount: 10,
      }),
    );

    expect(ids(unlocked)).toEqual([
      'first-step',
      'knowledge-master',
      'high-score',
      'perfect-mind',
      'hot-streak',
      'unstoppable',
    ]);
  });

  it('unlocks Hot Streak at 3 and Unstoppable at 5', () => {
    const service = TestBed.inject(AchievementService);

    expect(ids(service.recordStreak(3))).toEqual(['hot-streak']);
    expect(ids(service.recordStreak(4))).toEqual([]);
    expect(ids(service.recordStreak(5))).toEqual(['unstoppable']);
  });

  it('unlocks High Score only when a session reaches 100', () => {
    const service = TestBed.inject(AchievementService);

    expect(ids(service.recordScore(99))).toEqual([]);
    expect(ids(service.recordScore(100))).toEqual(['high-score']);
  });

  it('unlocks First Battle for a draw and Champion only for a win', () => {
    const service = TestBed.inject(AchievementService);

    expect(
      ids(
        service.recordBattleCompletion({
          signature: 'draw',
          won: false,
          scores: [20, 20],
          bestStreak: 1,
        }),
      ),
    ).toEqual(['first-battle']);
    expect(
      ids(
        service.recordBattleCompletion({
          signature: 'win-1',
          won: true,
          scores: [40, 10],
          bestStreak: 2,
        }),
      ),
    ).toEqual(['champion']);
    service.recordBattleCompletion({
      signature: 'win-2',
      won: true,
      scores: [30, 10],
      bestStreak: 1,
    });
    expect(
      ids(
        service.recordBattleCompletion({
          signature: 'win-3',
          won: true,
          scores: [50, 0],
          bestStreak: 2,
        }),
      ),
    ).toEqual(['rival-slayer']);
  });

  it('unlocks Hard Mode, AI Explorer, and AI Specialist from solo categories', () => {
    const service = TestBed.inject(AchievementService);
    const categories: QuestionCategory[] = [
      'AI Fundamentals',
      'Machine Learning',
      'Deep Learning',
      'Generative AI',
      'Prompt Engineering',
    ];

    categories.forEach((category, index) => {
      service.recordQuizCompletion(
        quizFacts({
          completedAt: index + 1,
          category,
          difficulty: index === 0 ? 'Hard' : 'Easy',
        }),
      );
    });

    const unlocked = service.unlocked().map((item) => item.id);
    expect(unlocked).toContain('hard-mode');
    expect(unlocked).toContain('ai-explorer');
    expect(unlocked).toContain('ai-specialist');
  });

  it('keeps unlocks when a new service reads localStorage', () => {
    TestBed.inject(AchievementService).recordQuizCompletion(
      quizFacts({ category: 'AI Fundamentals' }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), AchievementService],
    });
    const reloaded = TestBed.inject(AchievementService);
    reloaded.recordQuizCompletion(quizFacts({ completedAt: 2, category: 'Machine Learning' }));
    reloaded.recordQuizCompletion(quizFacts({ completedAt: 3, category: 'Deep Learning' }));

    expect(localStorage.getItem(ACHIEVEMENT_STORAGE_KEY)).toContain('first-step');
    expect(reloaded.unlocked().map((item) => item.id)).toContain('first-step');
    expect(reloaded.unlocked().map((item) => item.id)).toContain('ai-explorer');
  });

  it('ignores a repeated quiz completion and invalid stored JSON', () => {
    const service = TestBed.inject(AchievementService);
    service.recordQuizCompletion(quizFacts());
    expect(ids(service.recordQuizCompletion(quizFacts()))).toEqual([]);

    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, '{');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AchievementService],
    });

    expect(TestBed.inject(AchievementService).unlocked()).toEqual([]);
  });

  it('unlocks First Step from the result screen without changing the quiz score', async () => {
    const quiz = TestBed.inject(QuizService);
    expect(quiz.startQuiz('AI Fundamentals', 'Easy')).toBeTrue();
    for (let index = 0; index < 10; index += 1) {
      const question = quiz.currentQuestion();
      expect(question).not.toBeNull();
      if (!question) {
        return;
      }
      quiz.selectAnswer(question.correctIndex);
      quiz.nextQuestion();
      await Promise.resolve();
    }

    expect(quiz.isCompleted()).toBeTrue();

    const score = quiz.score();
    const fixture = TestBed.createComponent(ResultScreenComponent);
    fixture.detectChanges();

    const unlocked = TestBed.inject(AchievementService)
      .unlocked()
      .map((item) => item.id);
    expect(quiz.score()).toBe(score);
    expect(unlocked).toContain('first-step');
    expect(unlocked).toContain('perfect-mind');
    expect(unlocked).toContain('high-score');
    expect(unlocked).toContain('hot-streak');
    expect(unlocked).toContain('unstoppable');
    fixture.destroy();
  });

  it('unlocks Hot Streak while a solo quiz is in progress', fakeAsync(() => {
    const quiz = TestBed.inject(QuizService);
    const achievements = TestBed.inject(AchievementService);
    expect(quiz.startQuiz('Machine Learning', 'Medium')).toBeTrue();
    const fixture = TestBed.createComponent(QuizPageComponent);
    fixture.detectChanges();

    for (let index = 0; index < 3; index += 1) {
      const correctIndex = quiz.currentQuestion()?.correctIndex ?? 0;
      const options: NodeListOf<HTMLButtonElement> =
        fixture.nativeElement.querySelectorAll('button.option');
      options[correctIndex]?.click();
      fixture.detectChanges();
      tick(800);
      fixture.detectChanges();
    }

    expect(quiz.streak()).toBe(3);
    expect(achievements.unlocked().map((item) => item.id)).toContain('hot-streak');
    expect(achievements.unlocked().map((item) => item.id)).not.toContain('unstoppable');
    fixture.destroy();
    discardPeriodicTasks();
  }));

  it('unlocks First Battle and Champion from the battle result', () => {
    const battle = TestBed.inject(BattleService);
    battle.createBattle(
      [player('player-1', 'Ada', 50), player('player-2', 'Grace', 10)],
      [sampleQuestion()],
    );
    battle.startBattle();
    battle.completeBattle('player-1');
    const scores = battle.session()?.players.map((entry) => entry.score);

    const fixture = TestBed.createComponent(BattleResultComponent);
    fixture.detectChanges();

    const unlocked = TestBed.inject(AchievementService)
      .unlocked()
      .map((item) => item.id);
    expect(battle.session()?.players.map((entry) => entry.score)).toEqual(scores);
    expect(unlocked).toContain('first-battle');
    expect(unlocked).toContain('champion');
    expect(unlocked).not.toContain('rival-slayer');
    fixture.destroy();
  });

  it('shows the unlocked achievement, then hides it', fakeAsync(() => {
    const fixture = TestBed.createComponent(AchievementPopupComponent);
    fixture.detectChanges();
    TestBed.inject(AchievementService).recordStreak(3);
    fixture.detectChanges();

    const text = textOf(fixture);
    expect(text).toContain('Hot Streak');
    expect(text).toContain('Reach a streak of 3 correct answers.');
    expect(text).toContain('🔥');

    tick(ACHIEVEMENT_POPUP_MS + 320);
    fixture.detectChanges();
    expect(textOf(fixture)).not.toContain('Hot Streak');
    fixture.destroy();
    discardPeriodicTasks();
  }));

  it('lists unlocked and locked achievements and opens from the lobby', () => {
    TestBed.inject(AchievementService).recordQuizCompletion(quizFacts());
    const screen = TestBed.createComponent(AchievementScreenComponent);
    screen.detectChanges();

    const text = textOf(screen);
    expect(text).toContain('Unlocked');
    expect(text).toContain('First Step');
    expect(text).toContain('Locked');
    expect(text).toContain('Perfect Mind');
    screen.destroy();

    const lobby = TestBed.createComponent(GameHomeComponent);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    lobby.detectChanges();
    const button = Array.from(lobby.nativeElement.querySelectorAll('button')).find((entry) =>
      (entry as HTMLButtonElement).textContent?.includes('Achievements'),
    ) as HTMLButtonElement | undefined;
    expect(button).toBeTruthy();
    button?.click();
    expect(navigate).toHaveBeenCalledWith(['/achievements']);
    lobby.destroy();
  });
});

function ids(items: readonly Achievement[]): string[] {
  return items.map((item) => item.id);
}

function textOf(fixture: ComponentFixture<unknown>): string {
  return fixture.nativeElement.textContent ?? '';
}

function quizFacts(overrides: Partial<QuizCompletionFacts> = {}): QuizCompletionFacts {
  return {
    completedAt: 1,
    score: 10,
    accuracy: 10,
    maxStreak: 1,
    category: 'AI Fundamentals',
    difficulty: 'Easy',
    totalQuestions: 10,
    correctCount: 1,
    ...overrides,
  };
}

function player(id: string, name: string, score: number): BattlePlayer {
  return {
    id,
    name,
    score,
    correctAnswers: 0,
    streak: 0,
    bestStreak: 0,
    answers: [],
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
