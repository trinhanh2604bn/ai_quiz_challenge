import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { routes } from '../../../../app.routes';
import { AudioService } from '../../audio/services/audio.service';
import { QuizService } from '../../../quiz/services/quiz.service';
import { BattleService } from '../../services/battle.service';
import { GameService } from '../../services/game.service';
import { GameHomeComponent } from '../game-home/game-home';
import { GameSetupComponent } from '../game-setup/game-setup';
import { BattleSetupComponent } from './battle-setup';

describe('Battle setup', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
    const audio = TestBed.inject(AudioService);
    spyOn(audio, 'playButtonClick');
    spyOn(audio, 'playMenuMusic');
    spyOn(audio, 'playSelection');
  });

  it('opens battle setup from Two Players and keeps Single Player on /setup', () => {
    const fixture = TestBed.createComponent(GameHomeComponent);
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();

    const modeButtons = fixture.nativeElement.querySelectorAll('button.mode-card');
    modeButtons[1].click();

    const game = TestBed.inject(GameService);
    expect(game.mode()).toBe('two-player');
    expect(game.state()).toBe('setup');
    expect(navigate).toHaveBeenCalledWith(['/battle/setup']);

    modeButtons[0].click();

    expect(game.mode()).toBe('single-player');
    expect(game.state()).toBe('setup');
    expect(navigate).toHaveBeenCalledWith(['/setup']);
    fixture.destroy();
  });

  it('keeps start disabled until both names, a category, and a difficulty are set', () => {
    const fixture = createSetup();
    const start = startButton(fixture);
    expect(start.disabled).toBeTrue();

    setName(fixture, 'player-one', '   ');
    setName(fixture, 'player-two', 'Grace');
    clickChoice(fixture, 'AI Fundamentals');
    clickChoice(fixture, 'Easy');
    fixture.detectChanges();

    expect(startButton(fixture).disabled).toBeTrue();
    expect(TestBed.inject(BattleService).session()).toBeNull();

    setName(fixture, 'player-one', 'Ada');
    fixture.detectChanges();

    expect(startButton(fixture).disabled).toBeFalse();
    fixture.destroy();
  });

  it('creates a waiting battle with two players and 10 questions', () => {
    const fixture = createSetup();
    const quiz = TestBed.inject(QuizService);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const startQuiz = spyOn(quiz, 'startQuiz').and.callThrough();

    setName(fixture, 'player-one', ' Ada ');
    setName(fixture, 'player-two', 'Grace');
    clickChoice(fixture, 'Machine Learning');
    clickChoice(fixture, 'Hard');
    fixture.detectChanges();
    startButton(fixture).click();
    fixture.detectChanges();

    const session = TestBed.inject(BattleService).session();
    const game = TestBed.inject(GameService);
    expect(session?.players.map((player) => player.name)).toEqual(['Ada', 'Grace']);
    expect(session?.players.map((player) => player.score)).toEqual([0, 0]);
    expect(session?.players[0].answers).toEqual([]);
    expect(session?.players[1].answers).toEqual([]);
    expect(session?.questions.length).toBe(10);
    expect(
      session?.questions.every((question) => question.category === 'Machine Learning'),
    ).toBeTrue();
    expect(session?.questions.every((question) => question.difficulty === 'Hard')).toBeTrue();
    expect(session?.state).toBe('waiting');
    expect(session?.currentPlayerIndex).toBe(0);
    expect(session?.currentQuestionIndex).toBe(0);
    expect(game.mode()).toBe('two-player');
    expect(game.state()).toBe('playing');
    expect(quiz.quizStatus()).toBe('idle');
    expect(quiz.score()).toBe(0);
    expect(startQuiz).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/battle']);
    expect(fixture.nativeElement.textContent).toContain('Battle session created. Waiting to start.');
    fixture.destroy();
  });

  it('still starts the single-player quiz from game setup', () => {
    const fixture = TestBed.createComponent(GameSetupComponent);
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.selectCategory('AI Fundamentals');
    component.selectDifficulty('Easy');
    fixture.detectChanges();
    startButton(fixture).click();

    const quiz = TestBed.inject(QuizService);
    expect(quiz.quizStatus()).toBe('in-progress');
    expect(quiz.totalQuestions()).toBe(10);
    expect(quiz.score()).toBe(0);
    expect(TestBed.inject(GameService).mode()).toBe('single-player');
    expect(navigate).toHaveBeenCalledWith(['/quiz']);
    expect(TestBed.inject(BattleService).session()).toBeNull();
    fixture.destroy();
  });
});

function createSetup(): ComponentFixture<BattleSetupComponent> {
  const fixture = TestBed.createComponent(BattleSetupComponent);
  fixture.detectChanges();
  return fixture;
}

function startButton(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  const buttons = fixture.nativeElement.querySelectorAll('button');
  const button = Array.from(buttons).find(
    (item): item is HTMLButtonElement =>
      item instanceof HTMLButtonElement && item.textContent?.includes('Start') === true,
  );
  if (!button) {
    throw new Error('Missing start button');
  }
  return button;
}

function setName(
  fixture: ComponentFixture<BattleSetupComponent>,
  name: string,
  value: string,
): void {
  const input = fixture.nativeElement.querySelector(`input[name="${name}"]`);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`Missing ${name} input`);
  }
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function clickChoice(fixture: ComponentFixture<BattleSetupComponent>, label: string): void {
  const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button.choice');
  const match = Array.from(buttons).find((button) => button.textContent?.trim() === label);
  if (!match) {
    throw new Error(`Missing choice ${label}`);
  }
  match.click();
}
