import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { QuizService } from './quiz.service';

export const requireActiveQuiz: CanActivateFn = () => {
  const quiz = inject(QuizService);
  const router = inject(Router);
  if (quiz.isCompleted()) {
    return router.createUrlTree(['/result']);
  }

  if (!quiz.isInProgress()) {
    return router.createUrlTree(['/']);
  }

  return true;
};

export const requireCompletedQuiz: CanActivateFn = () => {
  if (inject(QuizService).isCompleted()) {
    return true;
  }

  return inject(Router).createUrlTree(['/']);
};
