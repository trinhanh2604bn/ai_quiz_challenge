import { Injectable } from '@angular/core';

const WARNING_MIN_INTERVAL_MS = 900;

interface ToneStep {
  frequency: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audioContext: AudioContext | null = null;
  private lastWarningAt = 0;

  playCorrectSound(): void {
    this.playSequence([
      { frequency: 523.25, duration: 0.09, type: 'sine', gain: 0.12 },
      { frequency: 659.25, duration: 0.14, type: 'sine', gain: 0.12 },
    ]);
  }

  playWrongSound(): void {
    this.playSequence([{ frequency: 174.61, duration: 0.18, type: 'triangle', gain: 0.08 }]);
  }

  playWarningSound(): void {
    const now = this.now();
    if (now - this.lastWarningAt < WARNING_MIN_INTERVAL_MS) {
      return;
    }

    this.lastWarningAt = now;
    this.playSequence([{ frequency: 880, duration: 0.07, type: 'sine', gain: 0.1 }]);
  }

  playCompleteSound(): void {
    this.playSequence([
      { frequency: 523.25, duration: 0.1, type: 'sine', gain: 0.12 },
      { frequency: 659.25, duration: 0.1, type: 'sine', gain: 0.12 },
      { frequency: 783.99, duration: 0.1, type: 'sine', gain: 0.12 },
      { frequency: 1046.5, duration: 0.18, type: 'sine', gain: 0.12 },
    ]);
  }

  private playSequence(steps: readonly ToneStep[]): void {
    try {
      const context = this.getContext();
      if (!context) {
        return;
      }

      let offset = 0;
      for (const step of steps) {
        this.scheduleTone(context, step, offset);
        offset += step.duration;
      }
    } catch {
      // Audio is optional. A blocked or missing output must not stop the quiz.
    }
  }

  private scheduleTone(context: AudioContext, step: ToneStep, offsetSeconds: number): void {
    const startAt = context.currentTime + offsetSeconds;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const attack = Math.min(0.01, step.duration / 3);

    oscillator.type = step.type;
    oscillator.frequency.setValueAtTime(step.frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(step.gain, startAt + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + step.duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => {
      try {
        oscillator.disconnect();
        gain.disconnect();
      } catch {
        // Node cleanup is best-effort and must not surface after playback.
      }
    };
    oscillator.start(startAt);
    oscillator.stop(startAt + step.duration);
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
      return null;
    }

    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioContext();
    }

    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume().catch(() => undefined);
    }

    return this.audioContext;
  }

  private now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
}
