import { Routes } from '@angular/router';
import { requireNoProfile, requireProfile } from './features/game/profile/services/profile.guard';

export const routes: Routes = [
  {
    path: 'profile/create',
    canMatch: [requireNoProfile],
    loadComponent: () =>
      import('./features/game/profile/components/profile-create/profile-create').then(
        (feature) => feature.ProfileCreateComponent,
      ),
  },
  {
    path: 'profile',
    canMatch: [requireProfile],
    loadComponent: () =>
      import('./features/game/profile/components/profile-page/profile-page').then(
        (feature) => feature.ProfilePageComponent,
      ),
  },
  {
    path: '',
    canMatch: [requireProfile],
    loadComponent: () =>
      import('./features/game/components/game-home/game-home').then(
        (feature) => feature.GameHomeComponent,
      ),
  },
  {
    path: 'setup',
    canMatch: [requireProfile],
    loadComponent: () =>
      import('./features/game/components/game-setup/game-setup').then(
        (feature) => feature.GameSetupComponent,
      ),
  },
  {
    path: 'achievements',
    canMatch: [requireProfile],
    loadComponent: () =>
      import(
        './features/game/achievements/components/achievement-screen/achievement-screen'
      ).then((feature) => feature.AchievementScreenComponent),
  },
  {
    path: 'ranking',
    canMatch: [requireProfile],
    loadComponent: () =>
      import('./features/game/ranking/components/ranking-page/ranking-page').then(
        (feature) => feature.RankingPageComponent,
      ),
  },
  {
    path: 'battle',
    canMatch: [requireProfile],
    loadChildren: () => import('./features/game/battle.routes').then((feature) => feature.battleRoutes),
  },
  {
    path: 'quiz',
    canMatch: [requireProfile],
    loadChildren: () => import('./features/quiz/quiz.routes').then((feature) => feature.quizRoutes),
  },
  {
    path: 'result',
    canMatch: [requireProfile],
    loadChildren: () => import('./features/quiz/result.routes').then((feature) => feature.resultRoutes),
  },
  { path: '**', redirectTo: '' },
];
