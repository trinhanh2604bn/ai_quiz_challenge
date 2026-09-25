import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type GameScene = 'studio' | 'home';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-game-background',
  imports: [],
  templateUrl: './game-background.html',
  styleUrl: './game-background.scss',
  host: {
    '[class.is-home]': 'scene() === "home"',
  },
})
export class GameBackgroundComponent {
  readonly scene = input<GameScene>('studio');
}
