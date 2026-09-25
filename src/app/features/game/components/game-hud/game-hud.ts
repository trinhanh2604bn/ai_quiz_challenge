import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ScorePopupComponent } from '../score-popup/score-popup';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-game-hud',
  imports: [ScorePopupComponent],
  templateUrl: './game-hud.html',
  styleUrl: './game-hud.scss',
})
export class GameHudComponent {
  readonly playerName = input.required<string>();
  readonly score = input.required<number>();
  readonly progress = input.required<number>();
  readonly streak = input.required<number>();
  readonly multiplier = input(1);
  readonly correctCount = input<number | null>(null);
  readonly questionLabel = input('');
  readonly detail = input('');
}
