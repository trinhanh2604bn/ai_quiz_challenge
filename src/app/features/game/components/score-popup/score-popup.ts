import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-score-popup',
  imports: [],
  templateUrl: './score-popup.html',
  styleUrl: './score-popup.scss',
})
export class ScorePopupComponent {
  readonly score = input.required<number>();
  readonly delta = signal<number | null>(null);
  private lastScore: number | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearHideTimer());

    effect(() => {
      const next = this.score();
      const previous = this.lastScore;
      this.lastScore = next;
      if (previous === null || next <= previous) {
        return;
      }

      this.delta.set(next - previous);
      this.clearHideTimer();
      this.hideTimer = setTimeout(() => this.delta.set(null), 720);
    });
  }

  private clearHideTimer(): void {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}
