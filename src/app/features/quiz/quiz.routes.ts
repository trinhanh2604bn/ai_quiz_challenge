import { Routes } from '@angular/router';
import { QuizPageComponent } from './components/quiz-page/quiz-page';
import { requireActiveQuiz } from './services/quiz.guard';

export const quizRoutes: Routes = [
  {
    path: '',
    component: QuizPageComponent,
    canActivate: [requireActiveQuiz],
  },
];
