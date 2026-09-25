import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, output, signal } from '@angular/core';
import { AudioService } from '../../services/audio.service';

const COUNTDOWN_SECONDS = 15;
const RING_LENGTH = 188.5;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-timer',
  imports: [],
  templateUrl: './timer.html',
  styleUrl: './timer.scss',
})
export class TimerComponent {
  readonly timedOut = output<void>();
  readonly secondsLeft = signal(COUNTDOWN_SECONDS);
  readonly fillPercent = computed(() => (this.secondsLeft() / COUNTDOWN_SECONDS) * 100);
  readonly ringLength = RING_LENGTH;
  readonly dashOffset = computed(() => RING_LENGTH * (1 - this.fillPercent() / 100));

  private readonly audio = inject(AudioService);
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
    if (remaining <= 5) {
      this.audio.playWarningSound();
    }
  }

  private clearCountdown(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
