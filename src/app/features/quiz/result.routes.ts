import { Routes } from '@angular/router';
import { ResultScreenComponent } from './components/result-screen/result-screen';
import { requireCompletedQuiz } from './services/quiz.guard';

export const resultRoutes: Routes = [
  {
    path: '',
    component: ResultScreenComponent,
    canActivate: [requireCompletedQuiz],
  },
];
