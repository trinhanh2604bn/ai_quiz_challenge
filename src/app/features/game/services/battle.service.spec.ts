import { TestBed } from '@angular/core/testing';
import { Question } from '../../quiz/models/question.model';
import { BattlePlayer } from '../models/battle-player.model';
import { BattleService } from './battle.service';

describe('BattleService', () => {
  let service: BattleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BattleService);
  });

  it('creates a waiting session with player 1 first and question index 0', () => {
    const first = player('p1', 'Ada', 10);
    const second = player('p2', 'Grace', 30);

    service.createBattle([first, second], [question('q1'), question('q2')]);

    const session = service.session();
    expect(session).not.toBeNull();
    expect(session?.state).toBe('waiting');
    expect(session?.currentPlayerIndex).toBe(0);
    expect(session?.currentQuestionIndex).toBe(0);
    expect(session?.winner).toBeNull();
    expect(service.currentPlayer()?.id).toBe('p1');
    expect(service.currentQuestion()?.id).toBe('q1');
    expect(service.state()).toBe('waiting');
    expect(session?.players[0].score).toBe(10);
    expect(session?.players[1].score).toBe(30);
    expect(first.score).toBe(10);
  });

  it('moves waiting to player-turn when the battle starts', () => {
    service.createBattle([player('p1', 'Ada'), player('p2', 'Grace')], [question('q1')]);

    service.startBattle();

    expect(service.state()).toBe('player-turn');
    expect(service.currentPlayer()?.id).toBe('p1');
    expect(service.session()?.currentQuestionIndex).toBe(0);
  });

  it('switches from player 1 to player 2 and can switch back', () => {
    service.createBattle([player('p1', 'Ada'), player('p2', 'Grace')]);
    service.startBattle();

    service.switchPlayer();

    expect(service.currentPlayer()?.id).toBe('p2');
    expect(service.session()?.currentPlayerIndex).toBe(1);
    expect(service.state()).toBe('transition');

    service.switchPlayer();

    expect(service.currentPlayer()?.id).toBe('p1');
    expect(service.session()?.currentPlayerIndex).toBe(0);
  });

  it('clears the session on reset', () => {
    service.createBattle([player('p1', 'Ada'), player('p2', 'Grace')], [question('q1')]);
    service.startBattle();

    service.resetBattle();

    expect(service.session()).toBeNull();
    expect(service.state()).toBeNull();
    expect(service.currentPlayer()).toBeNull();
    expect(service.currentQuestion()).toBeNull();
  });

  it('advances the question during a turn without changing scores or the active player', () => {
    service.createBattle(
      [player('p1', 'Ada', 10), player('p2', 'Grace', 40)],
      [question('q1'), question('q2')],
    );
    service.startBattle();

    service.nextQuestion();

    expect(service.session()?.currentQuestionIndex).toBe(1);
    expect(service.currentQuestion()?.id).toBe('q2');
    expect(service.currentPlayer()?.id).toBe('p1');
    expect(service.state()).toBe('transition');
    expect(service.session()?.players[0].score).toBe(10);
    expect(service.session()?.players[1].score).toBe(40);

    service.startBattle();
    service.nextQuestion();

    expect(service.session()?.currentQuestionIndex).toBe(1);
    expect(service.state()).toBe('player-turn');
  });

  it('records the supplied winner and does not compare scores', () => {
    service.createBattle(
      [player('p1', 'Ada', 0), player('p2', 'Grace', 100)],
      [question('q1')],
    );
    service.startBattle();

    service.completeBattle('p1');

    const session = service.session();
    expect(session?.state).toBe('completed');
    expect(session?.winner?.id).toBe('p1');
    expect(session?.winner?.name).toBe('Ada');
    expect(session?.players[0].score).toBe(0);
    expect(session?.players[1].score).toBe(100);
  });

  it('can complete with no winner', () => {
    service.createBattle([player('p1', 'Ada', 20), player('p2', 'Grace', 20)]);
    service.startBattle();

    service.completeBattle(null);

    expect(service.state()).toBe('completed');
    expect(service.session()?.winner).toBeNull();
    expect(service.session()?.players[0].score).toBe(20);
  });

  it('ignores an unknown winner and lifecycle calls with no session', () => {
    service.startBattle();
    service.switchPlayer();
    service.nextQuestion();
    service.completeBattle('missing');
    service.resetBattle();

    expect(service.session()).toBeNull();

    service.createBattle([player('p1', 'Ada'), player('p2', 'Grace')]);
    service.startBattle();
    service.completeBattle('missing');

    expect(service.state()).toBe('player-turn');
    expect(service.session()?.winner).toBeNull();
  });

  it('stores a judged answer on the active player only', () => {
    service.createBattle([player('p1', 'Ada', 10), player('p2', 'Grace', 40)], [question('q1')]);
    service.startBattle();

    service.recordAnswer(
      {
        questionId: 'q1',
        selectedAnswer: 0,
        correctAnswer: 0,
        isCorrect: true,
        responseTime: 1200,
      },
      { score: 20, correctAnswers: 1, streak: 1, bestStreak: 1 },
    );

    const session = service.session();
    expect(session?.players[0].score).toBe(20);
    expect(session?.players[0].answers).toEqual([
      {
        questionId: 'q1',
        selectedAnswer: 0,
        correctAnswer: 0,
        isCorrect: true,
        responseTime: 1200,
      },
    ]);
    expect(session?.players[1].score).toBe(40);
    expect(session?.players[1].answers).toEqual([]);
    expect(session?.state).toBe('player-turn');
  });
});

function player(id: string, name: string, score = 0): BattlePlayer {
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
