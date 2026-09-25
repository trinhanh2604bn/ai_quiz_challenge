import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ScorePopupComponent } from '../score-popup/score-popup';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-player-panel',
  imports: [ScorePopupComponent],
  templateUrl: './player-panel.html',
  styleUrl: './player-panel.scss',
})
export class PlayerPanelComponent {
  readonly name = input.required<string>();
  readonly score = input.required<number>();
  readonly streak = input.required<number>();
  readonly active = input(false);
  readonly tone = input<'pink' | 'blue'>('pink');
}
