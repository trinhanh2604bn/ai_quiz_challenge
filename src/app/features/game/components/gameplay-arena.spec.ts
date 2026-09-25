import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../../app.routes';
import { Question } from '../../quiz/models/question.model';
import { QuestionCardComponent } from '../../quiz/components/question-card/question-card';
import { QuizPageComponent } from '../../quiz/components/quiz-page/quiz-page';
import { TimerComponent } from '../../quiz/components/timer/timer';
import { AudioService } from '../../quiz/services/audio.service';
import { QuizService } from '../../quiz/services/quiz.service';
import { BattlePlayer } from '../models/battle-player.model';
import { BattleService } from '../services/battle.service';
import { GameService } from '../services/game.service';
import { BattleArenaComponent } from './battle-arena/battle-arena';
import { GameHudComponent } from './game-hud/game-hud';
import { PlayerPanelComponent } from './player-panel/player-panel';
import { ScorePopupComponent } from './score-popup/score-popup';

describe('Gameplay arena UI', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
    const audio = TestBed.inject(AudioService);
    spyOn(audio, 'playCorrectSound');
    spyOn(audio, 'playWrongSound');
    spyOn(audio, 'playWarningSound');
    spyOn(audio, 'playCompleteSound');
    spyOn(audio, 'playQuizMusic');
    spyOn(audio, 'playBattleMusic');
    spyOn(audio, 'playTimeoutSound');
    spyOn(audio, 'playTurnSwitch');
    spyOn(audio, 'playVictory');
  });

  afterEach(() => {
    document.documentElement.style.width = '';
    document.body.style.width = '';
  });

  it('renders score, progress, streak, and player information', () => {
    const fixture = TestBed.createComponent(GameHudComponent);
    fixture.componentRef.setInput('playerName', 'You');
    fixture.componentRef.setInput('score', 40);
    fixture.componentRef.setInput('progress', 30);
    fixture.componentRef.setInput('streak', 4);
    fixture.componentRef.setInput('multiplier', 2);
    fixture.componentRef.setInput('correctCount', 4);
    fixture.componentRef.setInput('questionLabel', 'Question 3 of 10');
    fixture.componentRef.setInput('detail', 'AI Fundamentals · Easy');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('You');
    expect(text).toContain('40');
    expect(text).toContain('30%');
    expect(text).toContain('2x');
    expect(text).toContain('Question 3 of 10');
    expect(text).toContain('AI Fundamentals · Easy');
    expect(fixture.nativeElement.querySelector('.streak')?.textContent).toContain('4');
    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).not.toBeNull();
    fixture.destroy();
  });

  it('shows player name, score, streak, and the active turn', () => {
    const fixture = TestBed.createComponent(PlayerPanelComponent);
    fixture.componentRef.setInput('name', 'Ada');
    fixture.componentRef.setInput('score', 20);
    fixture.componentRef.setInput('streak', 2);
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ada');
    expect(fixture.nativeElement.textContent).toContain('20');
    expect(fixture.nativeElement.querySelector('.streak')?.textContent).toContain('2');
    expect(fixture.nativeElement.textContent).toContain('Active turn');
    expect(fixture.nativeElement.querySelector('.is-active')).not.toBeNull();

    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Waiting');
    expect(fixture.nativeElement.querySelector('.is-active')).toBeNull();
    fixture.destroy();
  });

  it('pops the gained points when a displayed score increases', fakeAsync(() => {
    const fixture = TestBed.createComponent(ScorePopupComponent);
    fixture.componentRef.setInput('score', 10);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent ?? '').not.toContain('+');

    fixture.componentRef.setInput('score', 30);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('+20');

    tick(720);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent ?? '').not.toContain('+20');
    fixture.destroy();
  }));

  it('keeps answer selection on the question card', () => {
    const fixture = TestBed.createComponent(QuestionCardComponent);
    fixture.componentRef.setInput('question', sampleQuestion());
    fixture.componentRef.setInput('badge', 'Question 1');
    fixture.detectChanges();

    const heard: number[] = [];
    fixture.componentInstance.answerSelected.subscribe((index) => heard.push(index));
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('button.option.answer-card');
    expect(buttons.length).toBe(4);
    expect(fixture.nativeElement.querySelector('.badge')?.textContent).toContain('Question 1');
    expect(fixture.nativeElement.querySelector('.prompt')).not.toBeNull();

    buttons[0].click();
    expect(heard).toEqual([0]);

    fixture.componentRef.setInput('selectedIndex', 0);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button.option.correct')).not.toBeNull();
    fixture.destroy();
  });

  it('draws a circular timer that warns and then times out', fakeAsync(() => {
    const fixture = TestBed.createComponent(TimerComponent);
    fixture.detectChanges();

    const timer = fixture.nativeElement.querySelector('.timer') as HTMLElement;
    expect(timer.textContent).toContain('15s');
    expect(timer.querySelector('circle.progress')).not.toBeNull();
    expect(timer.classList.contains('urgent')).toBeFalse();
    expect(timer.classList.contains('timeout')).toBeFalse();

    tick(10000);
    fixture.detectChanges();
    expect(timer.textContent).toContain('5s');
    expect(timer.classList.contains('urgent')).toBeTrue();

    tick(5000);
    fixture.detectChanges();
    expect(timer.textContent).toContain('0s');
    expect(timer.classList.contains('timeout')).toBeTrue();
    expect(timer.classList.contains('urgent')).toBeFalse();

    fixture.destroy();
    discardPeriodicTasks();
  }));

  it('does not overflow the solo arena at 390px, 768px, and 1280px', fakeAsync(() => {
    expect(TestBed.inject(QuizService).startQuiz('Prompt Engineering', 'Hard')).toBeTrue();

    for (const width of [390, 768, 1280]) {
      setViewport(width);
      const fixture = TestBed.createComponent(QuizPageComponent);
      const host = fixture.nativeElement as HTMLElement;
      host.style.width = '100%';
      fixture.detectChanges();

      expect(horizontalOverflow(host)).withContext(`solo ${width}px`).toEqual([]);
      expect(host.querySelector('app-game-hud')).not.toBeNull();
      expect(host.querySelectorAll('button.option').length).toBe(4);
      fixture.destroy();
      discardPeriodicTasks();
    }
  }));

  it('does not overflow the battle arena or the pass screen', fakeAsync(() => {
    const longName = 'Pneumonoultramicroscopicsilicovolcanoconiosis';

    for (const width of [390, 768, 1280]) {
      setViewport(width);
      const playing = startArena(longName, sampleQuestion());
      const playingHost = playing.nativeElement as HTMLElement;
      playingHost.style.width = '100%';
      playing.detectChanges();

      expect(horizontalOverflow(playingHost)).withContext(`battle ${width}px`).toEqual([]);
      expect(playingHost.querySelectorAll('app-player-panel').length).toBe(2);
      expect(playingHost.querySelector('.vs')).not.toBeNull();
      expect(playingHost.querySelector('.turn-indicator')?.textContent).toContain(`${longName}'s turn`);
      playing.destroy();
      discardPeriodicTasks();
    }

    setViewport(390);
    const battle = TestBed.inject(BattleService);
    const game = TestBed.inject(GameService);
    game.setGameMode('two-player');
    game.changeState('playing');
    battle.createBattle(
      [player('player-1', longName), player('player-2', 'Grace')],
      [sampleQuestion()],
    );
    battle.startBattle();
    battle.switchPlayer();
    battle.switchPlayer();

    const passing = TestBed.createComponent(BattleArenaComponent);
    const passHost = passing.nativeElement as HTMLElement;
    passHost.style.width = '100%';
    passing.detectChanges();

    expect(passHost.textContent).toContain('Pass the device');
    expect(passHost.textContent).not.toContain('Alpha');
    expect(horizontalOverflow(passHost)).withContext('pass 390px').toEqual([]);
    passing.destroy();
    discardPeriodicTasks();
  }));
});

function setViewport(width: number): void {
  document.documentElement.style.width = `${width}px`;
  document.body.style.width = `${width}px`;
}

function startArena(name: string, round: Question): ComponentFixture<BattleArenaComponent> {
  const game = TestBed.inject(GameService);
  game.setGameMode('two-player');
  game.changeState('playing');
  TestBed.inject(BattleService).createBattle(
    [player('player-1', name), player('player-2', 'Grace')],
    [round],
  );
  const fixture = TestBed.createComponent(BattleArenaComponent);
  fixture.detectChanges();
  return fixture;
}

function sampleQuestion(): Question {
  return {
    id: 'arena-1',
    text: 'Which idea belongs with a long arena prompt about model behavior?',
    options: [
      'Pneumonoultramicroscopicsilicovolcanoconiosis',
      'Only the file name',
      'A hardware clock',
      'Random noise',
    ],
    correctIndex: 0,
    category: 'Prompt Engineering',
    difficulty: 'Hard',
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

function horizontalOverflow(root: HTMLElement): string[] {
  const nodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  return nodes
    .filter((node) => node.scrollWidth > node.clientWidth + 1)
    .map((node) => `${node.tagName}.${node.className}: ${node.scrollWidth}>${node.clientWidth}`);
}
