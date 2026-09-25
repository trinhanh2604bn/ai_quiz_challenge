import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { AudioService } from '../../services/audio.service';

const RING_LENGTH = 188.5;
const WARNING_SECONDS = 5;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-timer',
  imports: [],
  templateUrl: './timer.html',
  styleUrl: './timer.scss',
})
export class TimerComponent implements OnInit {
  readonly durationSeconds = input.required<number>();
  readonly halted = input(false);
  readonly timedOut = output<void>();
  readonly secondsLeft = signal(0);
  readonly fillPercent = computed(() => {
    const duration = this.durationSeconds();
    if (duration <= 0) {
      return 0;
    }

    return (this.secondsLeft() / duration) * 100;
  });
  readonly ringLength = RING_LENGTH;
  readonly dashOffset = computed(() => RING_LENGTH * (1 - this.fillPercent() / 100));

  private readonly audio = inject(AudioService);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private emittedTimeout = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearCountdown());
    effect(() => {
      if (this.halted()) {
        untracked(() => this.clearCountdown());
      }
    });
  }

  ngOnInit(): void {
    this.startCountdown();
  }

  private startCountdown(): void {
    this.clearCountdown();
    this.emittedTimeout = false;
    this.secondsLeft.set(this.durationSeconds());
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  private tick(): void {
    if (this.intervalId === null || this.halted() || this.emittedTimeout) {
      return;
    }

    const remaining = this.secondsLeft() - 1;
    if (remaining <= 0) {
      this.secondsLeft.set(0);
      this.clearCountdown();
      this.emittedTimeout = true;
      this.timedOut.emit();
      return;
    }

    this.secondsLeft.set(remaining);
    if (remaining <= WARNING_SECONDS) {
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
