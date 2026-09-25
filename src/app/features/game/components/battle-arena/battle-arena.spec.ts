import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from '../../../../app.routes';
import { Question } from '../../../quiz/models/question.model';
import { AudioService } from '../../../quiz/services/audio.service';
import { QuizService } from '../../../quiz/services/quiz.service';
import { BattlePlayer } from '../../models/battle-player.model';
import { BattleService } from '../../services/battle.service';
import { GameService } from '../../services/game.service';
import { BattleResultComponent } from '../battle-result/battle-result';
import { BattleArenaComponent } from './battle-arena';

describe('Battle arena', () => {
  beforeEach(() => {
    localStorage.removeItem('ai-quiz-leaderboard');
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
    const audio = TestBed.inject(AudioService);
    spyOn(audio, 'playCorrectSound');
    spyOn(audio, 'playWrongSound');
    spyOn(audio, 'playWarningSound');
    spyOn(audio, 'playCompleteSound');
    spyOn(audio, 'playBattleMusic');
    spyOn(audio, 'playTurnSwitch');
    spyOn(audio, 'playVictory');
  });

  it('starts player 1 on question 1 of 10', fakeAsync(() => {
    const fixture = startArena(questions(10));

    expect(textOf(fixture)).toContain("Ada's turn");
    expect(textOf(fixture)).toContain('Question 1 of 10');
    expect(TestBed.inject(BattleService).state()).toBe('player-turn');
    expect(TestBed.inject(BattleService).currentPlayer()?.id).toBe('player-1');
    expect(fixture.nativeElement.querySelector('app-timer')).not.toBeNull();

    fixture.destroy();
    discardPeriodicTasks();
  }));

  it('passes the device after player 1 and gives player 2 the same question', fakeAsync(() => {
    const fixture = startArena(questions(2));
    clickOption(fixture, 0);
    expect(fixture.nativeElement.querySelector('button.option.correct')).not.toBeNull();

    tick(800);
    fixture.detectChanges();

    expect(textOf(fixture)).toContain('Pass the device');
    expect(textOf(fixture)).toContain("Grace's turn");
    expect(textOf(fixture)).not.toContain('Prompt q-1');
    expect(textOf(fixture)).not.toContain('Alpha');

    clickContinue(fixture);

    expect(textOf(fixture)).toContain("Grace's turn");
    expect(textOf(fixture)).toContain('Prompt q-1');
    expect(textOf(fixture)).toContain('Question 1 of 2');
    expect(TestBed.inject(BattleService).session()?.currentQuestionIndex).toBe(0);
    expect(TestBed.inject(BattleService).currentPlayer()?.id).toBe('player-2');

    fixture.destroy();
    discardPeriodicTasks();
  }));

  it('keeps each player score, streak, and answers separate', fakeAsync(() => {
    const fixture = startArena(questions(2));
    clickOption(fixture, 0);
    tick(800);
    fixture.detectChanges();
    clickContinue(fixture);
    clickOption(fixture, 1);

    const session = TestBed.inject(BattleService).session();
    expect(session?.players[0].score).toBe(10);
    expect(session?.players[0].correctAnswers).toBe(1);
    expect(session?.players[0].streak).toBe(1);
    expect(session?.players[0].bestStreak).toBe(1);
    expect(session?.players[0].answers[0].isCorrect).toBeTrue();
    expect(session?.players[1].score).toBe(0);
    expect(session?.players[1].correctAnswers).toBe(0);
    expect(session?.players[1].streak).toBe(0);
    expect(session?.players[1].answers[0]).toEqual(
      jasmine.objectContaining({
        questionId: 'q-1',
        selectedAnswer: 1,
        isCorrect: false,
      }),
    );
    expect(TestBed.inject(QuizService).quizStatus()).toBe('idle');
    expect(TestBed.inject(QuizService).score()).toBe(0);

    tick(800);
    fixture.detectChanges();

    const advanced = TestBed.inject(BattleService).session();
    expect(advanced?.currentQuestionIndex).toBe(1);
    expect(advanced?.currentPlayerIndex).toBe(0);
    expect(advanced?.state).toBe('transition');
    expect(textOf(fixture)).toContain("Ada's turn");
    expect(textOf(fixture)).not.toContain('Prompt q-2');

    clickContinue(fixture);
    expect(textOf(fixture)).toContain('Question 2 of 2');
    expect(textOf(fixture)).toContain('Prompt q-2');
    expect(TestBed.inject(BattleService).currentPlayer()?.id).toBe('player-1');

    fixture.destroy();
    discardPeriodicTasks();
  }));

  it('records a timeout and switches the turn without revealing answers', fakeAsync(() => {
    const fixture = startArena(questions(2));

    expect(textOf(fixture)).toContain('20s');
    tick(20000);
    fixture.detectChanges();

    const ada = TestBed.inject(BattleService).session()?.players[0];
    expect(ada?.answers[0].selectedAnswer).toBeNull();
    expect(ada?.answers[0].isCorrect).toBeFalse();
    expect(ada?.score).toBe(0);
    expect(ada?.streak).toBe(0);
    expect(TestBed.inject(BattleService).state()).toBe('transition');
    expect(textOf(fixture)).toContain('Pass the device');
    expect(textOf(fixture)).toContain("Grace's turn");
    expect(textOf(fixture)).not.toContain('Alpha');

    clickContinue(fixture);
    expect(textOf(fixture)).toContain('Prompt q-1');
    expect(TestBed.inject(BattleService).currentPlayer()?.id).toBe('player-2');

    fixture.destroy();
    discardPeriodicTasks();
  }));

  it('opens the battle result route after both players finish the last question', fakeAsync(() => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = startArena([question('q-1')]);

    clickOption(fixture, 0);
    tick(800);
    fixture.detectChanges();
    clickContinue(fixture);
    clickOption(fixture, 1);
    tick(800);
    fixture.detectChanges();

    const session = TestBed.inject(BattleService).session();
    expect(session?.state).toBe('completed');
    expect(session?.winner?.id).toBe('player-1');
    expect(session?.currentQuestionIndex).toBe(0);
    expect(navigate).toHaveBeenCalledWith(['/battle/result']);
    expect(TestBed.inject(GameService).state()).toBe('result');

    fixture.destroy();
    discardPeriodicTasks();
  }));

  it('shows the completed battle on the result route', () => {
    const battle = TestBed.inject(BattleService);
    battle.createBattle(
      [player('player-1', 'Ada'), player('player-2', 'Grace')],
      [question('q-1')],
    );
    battle.startBattle();
    battle.completeBattle('player-1');

    const fixture = TestBed.createComponent(BattleResultComponent);
    fixture.detectChanges();

    expect(textOf(fixture)).toContain('Battle complete');
    expect(textOf(fixture)).toContain('Ada');
    expect(textOf(fixture)).toContain('Grace');
    expect(textOf(fixture)).toContain('Draw');
    fixture.destroy();
  });

  it('still scores a single-player streak with the shared quiz rules', async () => {
    const quiz = TestBed.inject(QuizService);
    expect(quiz.startQuiz('AI Fundamentals', 'Easy')).toBeTrue();

    for (let index = 0; index < 5; index += 1) {
      const current = quiz.currentQuestion();
      if (!current) {
        fail('Expected a quiz question');
        return;
      }
      quiz.selectAnswer(current.correctIndex);
      if (index < 4) {
        quiz.nextQuestion();
        await Promise.resolve();
      }
    }

    expect(quiz.score()).toBe(10 + 10 + 20 + 20 + 30);
    expect(quiz.streak()).toBe(5);
    expect(quiz.multiplier()).toBe(3);
    expect(TestBed.inject(BattleService).session()).toBeNull();
  });
});

function startArena(round: readonly Question[]): ComponentFixture<BattleArenaComponent> {
  const game = TestBed.inject(GameService);
  game.setGameMode('two-player');
  game.changeState('playing');
  TestBed.inject(BattleService).createBattle(
    [player('player-1', 'Ada'), player('player-2', 'Grace')],
    round,
  );
  const fixture = TestBed.createComponent(BattleArenaComponent);
  fixture.detectChanges();
  return fixture;
}

function questions(count: number): Question[] {
  return Array.from({ length: count }, (_, index) => question(`q-${index + 1}`));
}

function question(id: string): Question {
  return {
    id,
    text: `Prompt ${id}`,
    options: ['Alpha', 'Beta', 'Gamma', 'Delta'],
    correctIndex: 0,
    category: 'AI Fundamentals',
    difficulty: 'Easy',
  };
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

function textOf(fixture: ComponentFixture<unknown>): string {
  return fixture.nativeElement.textContent ?? '';
}

function clickOption(fixture: ComponentFixture<BattleArenaComponent>, index: number): void {
  const buttons: NodeListOf<HTMLButtonElement> =
    fixture.nativeElement.querySelectorAll('button.option');
  const button = buttons[index];
  if (!button) {
    throw new Error(`Missing option ${index}`);
  }
  button.click();
  fixture.detectChanges();
}

function clickContinue(fixture: ComponentFixture<BattleArenaComponent>): void {
  const button = fixture.nativeElement.querySelector('button.continue');
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('Missing continue button');
  }
  button.click();
  fixture.detectChanges();
}
