import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QuizPageComponent } from '../components/quiz-page/quiz-page';
import { ResultScreenComponent } from '../components/result-screen/result-screen';
import { AnswerRecord } from '../models/answer-record.model';
import { AnalyticsService, buildPerformanceReport } from './analytics.service';
import { QuizService } from './quiz.service';

describe('buildPerformanceReport', () => {
  it('reports 80% accuracy for 8 correct answers out of 10', () => {
    const records = Array.from({ length: 10 }, (_, index) =>
      attempt({
        questionId: `q-${index}`,
        isCorrect: index < 8,
        responseTime: (index + 1) * 1000,
      }),
    );

    const report = buildPerformanceReport(records, 180);

    expect(report.totalQuestions).toBe(10);
    expect(report.correctAnswers).toBe(8);
    expect(report.accuracy).toBe(80);
    expect(report.finalScore).toBe(180);
    expect(report.averageResponseTime).toBe(5500);
    expect(report.bestStreak).toBe(8);
    expect(report.categoryPerformance).toEqual([
      { label: 'AI Fundamentals', correct: 8, total: 10, accuracy: 80 },
    ]);
    expect(report.difficultyPerformance).toEqual([
      { label: 'Easy', correct: 8, total: 10, accuracy: 80 },
      { label: 'Medium', correct: 0, total: 0, accuracy: 0 },
      { label: 'Hard', correct: 0, total: 0, accuracy: 0 },
    ]);
  });

  it('averages every attempt, including timeouts', () => {
    const records = [
      attempt({ responseTime: 2000, isCorrect: true }),
      attempt({
        questionId: 'timeout',
        responseTime: 15000,
        isCorrect: false,
        selectedAnswer: null,
      }),
      attempt({ questionId: 'slow', responseTime: 4000, isCorrect: false, selectedAnswer: 1 }),
    ];

    const report = buildPerformanceReport(records, 10);

    expect(report.averageResponseTime).toBe(7000);
    expect(report.accuracy).toBe(33);
    expect(report.bestStreak).toBe(1);
  });

  it('calculates accuracy for each category that was attempted', () => {
    const records = [
      attempt({ category: 'AI Fundamentals', isCorrect: true }),
      attempt({ category: 'AI Fundamentals', isCorrect: false, selectedAnswer: 1 }),
      attempt({ questionId: 'ml-1', category: 'Machine Learning', isCorrect: true }),
      attempt({ questionId: 'ml-2', category: 'Machine Learning', isCorrect: true }),
      attempt({ questionId: 'dl-1', category: 'Deep Learning', isCorrect: true }),
      attempt({ questionId: 'dl-2', category: 'Deep Learning', isCorrect: true }),
      attempt({
        questionId: 'dl-3',
        category: 'Deep Learning',
        isCorrect: false,
        selectedAnswer: 2,
      }),
      attempt({
        questionId: 'ga-1',
        category: 'Generative AI',
        isCorrect: false,
        selectedAnswer: null,
      }),
    ];

    const report = buildPerformanceReport(records, 40);

    expect(report.categoryPerformance).toEqual([
      { label: 'AI Fundamentals', correct: 1, total: 2, accuracy: 50 },
      { label: 'Machine Learning', correct: 2, total: 2, accuracy: 100 },
      { label: 'Deep Learning', correct: 2, total: 3, accuracy: 67 },
      { label: 'Generative AI', correct: 0, total: 1, accuracy: 0 },
    ]);
  });

  it('calculates Easy, Medium, and Hard accuracy', () => {
    const records = [
      attempt({ difficulty: 'Easy', isCorrect: true }),
      attempt({ questionId: 'm1', difficulty: 'Medium', isCorrect: true }),
      attempt({
        questionId: 'm2',
        difficulty: 'Medium',
        isCorrect: false,
        selectedAnswer: 1,
      }),
      attempt({ questionId: 'h1', difficulty: 'Hard', isCorrect: true }),
      attempt({ questionId: 'h2', difficulty: 'Hard', isCorrect: true }),
      attempt({
        questionId: 'h3',
        difficulty: 'Hard',
        isCorrect: false,
        selectedAnswer: null,
      }),
    ];

    const report = buildPerformanceReport(records, 30);

    expect(report.difficultyPerformance).toEqual([
      { label: 'Easy', correct: 1, total: 1, accuracy: 100 },
      { label: 'Medium', correct: 1, total: 2, accuracy: 50 },
      { label: 'Hard', correct: 2, total: 3, accuracy: 67 },
    ]);
  });

  it('resets the best streak after a wrong answer or a timeout', () => {
    const records = [
      attempt({ isCorrect: true }),
      attempt({ questionId: '2', isCorrect: true }),
      attempt({ questionId: '3', isCorrect: false, selectedAnswer: null }),
      attempt({ questionId: '4', isCorrect: true }),
      attempt({ questionId: '5', isCorrect: true }),
      attempt({ questionId: '6', isCorrect: true }),
      attempt({ questionId: '7', isCorrect: false, selectedAnswer: 1 }),
    ];

    expect(buildPerformanceReport(records, 50).bestStreak).toBe(3);
  });
});

describe('QuizService answer history', () => {
  let quiz: QuizService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    quiz = TestBed.inject(QuizService);
  });

  it('keeps an 8-of-10 session at 80% without changing the score', async () => {
    expect(quiz.startQuiz('AI Fundamentals', 'Easy')).toBeTrue();

    for (let index = 0; index < 8; index += 1) {
      await answerCurrent(quiz, true);
    }
    for (let index = 0; index < 2; index += 1) {
      await answerCurrent(quiz, false);
    }

    const result = quiz.result();
    expect(result).not.toBeNull();
    if (!result) {
      return;
    }

    const report = buildPerformanceReport(quiz.answerHistory(), result.score);

    expect(quiz.isCompleted()).toBeTrue();
    expect(result.correctCount).toBe(8);
    expect(result.accuracy).toBe(80);
    expect(result.score).toBe(180);
    expect(result.maxStreak).toBe(8);
    expect(quiz.answerHistory().length).toBe(10);
    expect(report.accuracy).toBe(80);
    expect(report.finalScore).toBe(180);
    expect(report.bestStreak).toBe(result.maxStreak);
    expect(report.categoryPerformance[0]).toEqual({
      label: 'AI Fundamentals',
      correct: 8,
      total: 10,
      accuracy: 80,
    });
    expect(report.difficultyPerformance[0]).toEqual({
      label: 'Easy',
      correct: 8,
      total: 10,
      accuracy: 80,
    });
  });

  it('records the elapsed time when an answer is selected', async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(1_700_000_000_000));

    try {
      quiz.startQuiz('Machine Learning', 'Medium');
      const question = quiz.currentQuestion();
      expect(question).not.toBeNull();
      if (!question) {
        return;
      }

      quiz.markQuestionDisplayed(question.id);
      jasmine.clock().tick(2500);
      quiz.markQuestionDisplayed(question.id);
      jasmine.clock().tick(500);
      quiz.selectAnswer(question.correctIndex);

      expect(quiz.score()).toBe(10);
      expect(quiz.answerHistory()[0]).toEqual(
        jasmine.objectContaining({
          questionId: question.id,
          selectedAnswer: question.correctIndex,
          correctAnswer: question.correctIndex,
          isCorrect: true,
          responseTime: 3000,
        }),
      );
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('records a timeout without awarding points or keeping the streak', async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(1_700_000_000_000));

    try {
      quiz.startQuiz('Deep Learning', 'Hard');
      await answerCurrent(quiz, true);
      const question = quiz.currentQuestion();
      expect(question).not.toBeNull();
      if (!question) {
        return;
      }

      quiz.markQuestionDisplayed(question.id);
      jasmine.clock().tick(15000);
      quiz.skipQuestion();

      expect(quiz.score()).toBe(10);
      expect(quiz.streak()).toBe(0);
      expect(quiz.answerHistory()[1]).toEqual(
        jasmine.objectContaining({
          questionId: question.id,
          selectedAnswer: null,
          correctAnswer: question.correctIndex,
          isCorrect: false,
          responseTime: 15000,
        }),
      );
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('exposes the session report only after the quiz is complete', async () => {
    const analytics = TestBed.inject(AnalyticsService);
    expect(analytics.report()).toBeNull();

    quiz.startQuiz('Prompt Engineering', 'Easy');
    for (let index = 0; index < 10; index += 1) {
      await answerCurrent(quiz, index < 8);
    }

    const result = quiz.result();
    expect(result).not.toBeNull();
    if (!result) {
      return;
    }

    expect(analytics.report()).toEqual(
      jasmine.objectContaining({
        totalQuestions: 10,
        correctAnswers: 8,
        accuracy: 80,
        finalScore: result.score,
      }),
    );
  });
});

function attempt(overrides: Partial<AnswerRecord> = {}): AnswerRecord {
  return {
    questionId: 'q-1',
    category: 'AI Fundamentals',
    difficulty: 'Easy',
    selectedAnswer: 0,
    correctAnswer: 0,
    isCorrect: true,
    responseTime: 1000,
    ...overrides,
  };
}

async function answerCurrent(quiz: QuizService, correct: boolean): Promise<void> {
  const question = quiz.currentQuestion();
  if (!question) {
    throw new Error('expected a question');
  }

  quiz.markQuestionDisplayed(question.id);
  const selected = correct ? question.correctIndex : wrongOption(question.correctIndex);
  quiz.selectAnswer(selected);
  quiz.nextQuestion();
  await Promise.resolve();
}

function wrongOption(correctIndex: 0 | 1 | 2 | 3): 0 | 1 | 2 | 3 {
  const option = ((correctIndex + 1) % 4) as 0 | 1 | 2 | 3;
  return option;
}

describe('Performance dashboard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
  });

  it('renders 80% accuracy, response time, and category and difficulty bars', async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(1_700_000_000_000));
    const quiz = TestBed.inject(QuizService);

    try {
      expect(quiz.startQuiz('AI Fundamentals', 'Easy')).toBeTrue();
      for (let index = 0; index < 10; index += 1) {
        await answerTimed(quiz, index < 8, 1000);
      }
    } finally {
      jasmine.clock().uninstall();
    }

    const fixture = TestBed.createComponent(ResultScreenComponent);
    fixture.detectChanges();
    const dashboard: HTMLElement | null = fixture.nativeElement.querySelector(
      'app-performance-dashboard',
    );

    expect(dashboard).not.toBeNull();
    if (!dashboard) {
      fixture.destroy();
      return;
    }

    expect(dashboard.textContent).toContain('Performance dashboard');
    expect(dashboard.textContent).toContain('180');
    expect(dashboard.textContent).toContain('80%');
    expect(dashboard.textContent).toContain('8 / 10 correct');
    expect(dashboard.textContent).toContain('1.0 s');
    expect(dashboard.textContent).toContain('1000 ms');
    expect(dashboard.textContent).toContain('AI Fundamentals');
    expect(dashboard.textContent).toContain('8/10 · 80%');
    expect(dashboard.textContent).toContain('Easy');
    expect(dashboard.textContent).toContain('Medium');
    expect(dashboard.textContent).toContain('Hard');
    expect(dashboard.textContent).toContain('Not attempted');
    expect(fixture.nativeElement.textContent).toContain('Time taken');
    expect(fixture.nativeElement.textContent).toContain('00:10');

    const fills = Array.from(dashboard.querySelectorAll('.fill'), (element) => {
      return (element as HTMLElement).style.width;
    });
    expect(fills).toEqual(['80%', '80%', '0%', '0%']);
    fixture.destroy();
  });

  it('still shows four answers and a 15 second timer on Medium', async () => {
    const quiz = TestBed.inject(QuizService);
    expect(quiz.startQuiz('Generative AI', 'Medium')).toBeTrue();
    const markDisplayed = spyOn(quiz, 'markQuestionDisplayed').and.callThrough();

    const fixture = TestBed.createComponent(QuizPageComponent);
    fixture.detectChanges();
    await Promise.resolve();

    const options: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('button.option');
    expect(options.length).toBe(4);
    expect(fixture.nativeElement.textContent).toContain('15s');
    expect(markDisplayed).toHaveBeenCalledWith(quiz.currentQuestion()?.id);

    options[0].click();
    fixture.detectChanges();

    const marked = fixture.nativeElement.querySelector(
      'button.option.correct, button.option.incorrect',
    );
    expect(marked).not.toBeNull();
    expect(quiz.answerHistory().length).toBe(1);
    fixture.destroy();
  });
});

async function answerTimed(quiz: QuizService, correct: boolean, elapsedMs: number): Promise<void> {
  const question = quiz.currentQuestion();
  if (!question) {
    throw new Error('expected a question');
  }

  quiz.markQuestionDisplayed(question.id);
  jasmine.clock().tick(elapsedMs);
  quiz.selectAnswer(correct ? question.correctIndex : wrongOption(question.correctIndex));
  quiz.nextQuestion();
  await Promise.resolve();
}
