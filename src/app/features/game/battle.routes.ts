import { Routes } from '@angular/router';
import { BattleArenaComponent } from './components/battle-arena/battle-arena';
import { BattleResultComponent } from './components/battle-result/battle-result';
import { BattleSetupComponent } from './components/battle-setup/battle-setup';
import { requireActiveBattle, requireCompletedBattle } from './services/battle.guard';

export const battleRoutes: Routes = [
  { path: 'setup', component: BattleSetupComponent },
  {
    path: 'result',
    component: BattleResultComponent,
    canActivate: [requireCompletedBattle],
  },
  {
    path: '',
    component: BattleArenaComponent,
    canActivate: [requireActiveBattle],
  },
];
