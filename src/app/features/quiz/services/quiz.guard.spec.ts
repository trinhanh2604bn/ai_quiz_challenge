import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { routes } from '../../../app.routes';
import { requireActiveQuiz, requireCompletedQuiz } from './quiz.guard';
import { QuizService } from './quiz.service';

describe('Quiz access guards', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
  });

  it('sends an idle quiz home and a finished quiz to the result screen', async () => {
    expect(guardPath(requireActiveQuiz)).toBe('/');
    expect(guardPath(requireCompletedQuiz)).toBe('/');

    const quiz = TestBed.inject(QuizService);
    expect(quiz.startQuiz('AI Fundamentals', 'Easy')).toBeTrue();
    expect(guardAllows(requireActiveQuiz)).toBeTrue();

    for (let index = 0; index < quiz.sessionQuestionCount; index += 1) {
      const question = quiz.currentQuestion();
      expect(question).not.toBeNull();
      if (!question) {
        return;
      }
      quiz.selectAnswer(question.correctIndex);
      quiz.nextQuestion();
      await Promise.resolve();
    }

    expect(guardPath(requireActiveQuiz)).toBe('/result');
    expect(guardAllows(requireCompletedQuiz)).toBeTrue();
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
