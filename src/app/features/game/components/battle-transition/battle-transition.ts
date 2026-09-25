import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-battle-transition',
  templateUrl: './battle-transition.html',
  styleUrl: './battle-transition.scss',
})
export class BattleTransitionComponent {
  readonly playerName = input.required<string>();
  readonly continued = output<void>();
}
