import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { GameCardComponent } from '../game-card/game-card';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-battle-transition',
  imports: [GameCardComponent],
  templateUrl: './battle-transition.html',
  styleUrl: './battle-transition.scss',
})
export class BattleTransitionComponent {
  readonly playerName = input.required<string>();
  readonly continued = output<void>();
}
