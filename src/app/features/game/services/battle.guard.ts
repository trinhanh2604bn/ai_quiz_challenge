import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BattleService } from './battle.service';

export const requireActiveBattle: CanActivateFn = () => {
  const session = inject(BattleService).session();
  const router = inject(Router);
  if (!session || session.questions.length === 0) {
    return router.createUrlTree(['/battle/setup']);
  }

  if (session.state === 'completed') {
    return router.createUrlTree(['/battle/result']);
  }

  return true;
};

export const requireCompletedBattle: CanActivateFn = () => {
  const session = inject(BattleService).session();
  const router = inject(Router);
  if (!session) {
    return router.createUrlTree(['/battle/setup']);
  }

  if (session.state !== 'completed') {
    return router.createUrlTree(['/battle']);
  }

  return true;
};
