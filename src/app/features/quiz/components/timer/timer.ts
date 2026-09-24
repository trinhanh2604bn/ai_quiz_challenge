import { Component, DestroyRef, computed, inject, output, signal } from '@angular/core';

const COUNTDOWN_SECONDS = 15;

@Component({
  selector: 'app-timer',
  imports: [],
  templateUrl: './timer.html',
  styleUrl: './timer.scss',
})
export class TimerComponent {
  readonly timedOut = output<void>();
  readonly secondsLeft = signal(COUNTDOWN_SECONDS);
  readonly fillPercent = computed(() => (this.secondsLeft() / COUNTDOWN_SECONDS) * 100);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearCountdown());
    this.startCountdown();
  }

  private startCountdown(): void {
    this.clearCountdown();
    this.secondsLeft.set(COUNTDOWN_SECONDS);
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  private tick(): void {
    if (this.intervalId === null) {
      return;
    }

    const remaining = this.secondsLeft() - 1;
    if (remaining <= 0) {
      this.secondsLeft.set(0);
      this.clearCountdown();
      this.timedOut.emit();
      return;
    }

    this.secondsLeft.set(remaining);
  }

  private clearCountdown(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
