import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type GameButtonVariant = 'primary' | 'secondary';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-game-button',
  imports: [],
  templateUrl: './game-button.html',
  styleUrl: './game-button.scss',
  host: {
    '[class.is-primary]': 'variant() === "primary"',
    '[class.is-secondary]': 'variant() === "secondary"',
    '[class.is-disabled]': 'disabled()',
  },
})
export class GameButtonComponent {
  readonly variant = input<GameButtonVariant>('primary');
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly buttonRole = input<string | null>(null);
  readonly expanded = input<boolean | null>(null);
  readonly checked = input<boolean | null>(null);
  readonly popup = input<string | null>(null);
}
