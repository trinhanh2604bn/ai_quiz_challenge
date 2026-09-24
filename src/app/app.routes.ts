import { Routes } from '@angular/router';
import { QuizPageComponent } from './features/quiz/components/quiz-page/quiz-page';
import { ResultScreenComponent } from './features/quiz/components/result-screen/result-screen';
import { StartScreenComponent } from './features/quiz/components/start-screen/start-screen';

export const routes: Routes = [
  { path: '', component: StartScreenComponent },
  { path: 'quiz', component: QuizPageComponent },
  { path: 'result', component: ResultScreenComponent },
  { path: '**', redirectTo: '' },
];
