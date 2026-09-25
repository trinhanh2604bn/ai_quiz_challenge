import { TestBed } from '@angular/core/testing';
import { formatQuizDuration } from '../models/quiz-result.model';
import { questionSeconds } from '../models/question-seconds';
import { QuizService } from './quiz.service';

describe('questionSeconds', () => {
  it('maps Easy, Medium, and Hard to 20, 15, and 10 seconds', () => {
    expect(questionSeconds('Easy')).toBe(20);
    expect(questionSeconds('Medium')).toBe(15);
    expect(questionSeconds('Hard')).toBe(10);
  });
});

describe('formatQuizDuration', () => {
  it('renders elapsed time as minutes and seconds', () => {
    expect(formatQuizDuration(0)).toBe('00:00');
    expect(formatQuizDuration(102_000)).toBe('01:42');
    expect(formatQuizDuration(61_900)).toBe('01:01');
  });
});

describe('QuizService session duration', () => {
  let quiz: QuizService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    quiz = TestBed.inject(QuizService);
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(1_700_000_000_000));
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('freezes total time when the last answer completes the session', async () => {
    expect(quiz.startQuiz('AI Fundamentals', 'Easy')).toBeTrue();
    jasmine.clock().tick(90_000);
    await answerAll(quiz);

    expect(quiz.result()?.timeTakenMs).toBe(90_000);
    jasmine.clock().tick(5_000);
    expect(quiz.result()?.timeTakenMs).toBe(90_000);
    expect(quiz.isCompleted()).toBeTrue();
  });

  it('includes skipped questions and starts over for the next session', async () => {
    expect(quiz.startQuiz('Machine Learning', 'Hard')).toBeTrue();
    for (let index = 0; index < 10; index += 1) {
      jasmine.clock().tick(1_000);
      quiz.skipQuestion();
      await Promise.resolve();
    }

    expect(quiz.result()?.timeTakenMs).toBe(10_000);
    expect(quiz.streak()).toBe(0);

    expect(quiz.startQuiz('Machine Learning', 'Medium')).toBeTrue();
    jasmine.clock().tick(2_500);
    await answerAll(quiz);
    expect(quiz.result()?.timeTakenMs).toBe(2_500);
  });
});

async function answerAll(quiz: QuizService): Promise<void> {
  for (let index = 0; index < 10; index += 1) {
    const question = quiz.currentQuestion();
    if (!question) {
      throw new Error('expected a question');
    }

    quiz.selectAnswer(question.correctIndex);
    quiz.nextQuestion();
    await Promise.resolve();
  }
}
