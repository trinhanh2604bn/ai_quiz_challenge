import { Injectable, NgZone, OnDestroy, effect, inject, signal } from '@angular/core';
import { clampVolume } from '../../models/game-settings.model';
import { SettingsService } from '../../services/settings.service';
import { AUDIO_LIBRARY } from '../data/audio-library.data';
import {
  AudioPlaybackState,
  AudioScene,
  SoundCueId,
  ToneStep,
} from '../models/sound-cue.model';

const WARNING_MIN_INTERVAL_MS = 900;
const MUSIC_LEVEL = 0.4;

interface LiveVoice {
  group: 'music' | 'effect';
  oscillator: OscillatorNode;
  gain: GainNode;
}

@Injectable({
  providedIn: 'root',
})
export class AudioService implements OnDestroy {
  private readonly settings = inject(SettingsService);
  private readonly zone = inject(NgZone);

  readonly lastCue = signal<SoundCueId | null>(null);
  readonly activeMusic = signal<AudioScene | null>(null);
  readonly unlocked = signal(false);

  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private outputGain = 1;
  private desiredMusic: AudioScene | null = null;
  private playingMusic: AudioScene | null = null;
  private musicGeneration = 0;
  private lastWarningAt = 0;
  private readonly live: LiveVoice[] = [];
  private removeUnlock: () => void = () => undefined;

  constructor() {
    this.outputGain = this.currentOutputGain();
    this.zone.runOutsideAngular(() => {
      this.removeUnlock = this.listenForUnlock();
    });

    effect(() => {
      const enabled = this.settings.soundEnabled();
      const volume = this.settings.volume();
      this.zone.runOutsideAngular(() => this.applySettings(enabled, volume));
    });
  }

  ngOnDestroy(): void {
    this.removeUnlock();
    this.desiredMusic = null;
    this.haltMusic();
    this.stopEffects();
    const context = this.audioContext;
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    if (context && context.state !== 'closed') {
      void context.close().catch(() => undefined);
    }
  }

  unlock(): void {
    this.removeUnlock();
    this.removeUnlock = () => undefined;
    this.zone.runOutsideAngular(() => {
      this.unlocked.set(true);
      this.resume();
      this.pumpMusic();
    });
  }

  playButtonClick(): void {
    this.zone.runOutsideAngular(() => this.playEffect('button'));
  }

  playSelection(): void {
    this.zone.runOutsideAngular(() => this.playEffect('selection'));
  }

  playCorrectSound(): void {
    this.zone.runOutsideAngular(() => this.playEffect('correct'));
  }

  playWrongSound(): void {
    this.zone.runOutsideAngular(() => this.playEffect('wrong'));
  }

  playTimeoutSound(): void {
    this.zone.runOutsideAngular(() => this.playEffect('timeout'));
  }

  playWarningSound(): void {
    this.zone.runOutsideAngular(() => this.playWarning());
  }

  playCompleteSound(): void {
    this.zone.runOutsideAngular(() => this.playEffect('complete'));
  }

  playAchievementSound(): void {
    this.zone.runOutsideAngular(() => this.playEffect('achievement'));
  }

  playTurnSwitch(): void {
    this.zone.runOutsideAngular(() => this.playEffect('turn'));
  }

  playVictory(): void {
    this.zone.runOutsideAngular(() => this.playEffect('victory'));
  }

  playMenuMusic(): void {
    this.zone.runOutsideAngular(() => this.requestMusic('menu'));
  }

  playQuizMusic(): void {
    this.zone.runOutsideAngular(() => this.requestMusic('quiz'));
  }

  playBattleMusic(): void {
    this.zone.runOutsideAngular(() => this.requestMusic('battle'));
  }

  stopScene(scene: AudioScene): void {
    this.zone.runOutsideAngular(() => {
      if (this.desiredMusic !== scene) {
        return;
      }

      this.desiredMusic = null;
      this.haltMusic();
    });
  }

  playbackState(): AudioPlaybackState {
    if (!this.audioContext) {
      return 'unavailable';
    }

    return this.audioContext.state;
  }

  masterVolume(): number {
    return this.outputGain;
  }

  activeVoiceCount(): number {
    return this.live.length;
  }

  private playWarning(): void {
    if (!this.settings.soundEnabled()) {
      return;
    }

    const now = this.now();
    if (now - this.lastWarningAt < WARNING_MIN_INTERVAL_MS) {
      return;
    }

    this.lastWarningAt = now;
    this.playEffect('warning');
  }

  private playEffect(id: SoundCueId): void {
    if (!this.settings.soundEnabled()) {
      return;
    }

    const cue = AUDIO_LIBRARY[id];
    this.lastCue.set(id);
    const context = this.getContext();
    if (!context || !this.masterGain) {
      return;
    }

    let offset = 0;
    for (const step of cue.steps) {
      this.scheduleTone(context, step, offset, this.masterGain, 'effect');
      offset += step.duration;
    }
  }

  private requestMusic(scene: AudioScene): void {
    if (this.desiredMusic === scene) {
      this.pumpMusic();
      return;
    }

    this.desiredMusic = scene;
    this.haltMusic();
    this.pumpMusic();
  }

  private applySettings(enabled: boolean, volume: number): void {
    this.outputGain = enabled ? clampVolume(volume) : 0;
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(this.outputGain, this.audioContext.currentTime);
    }

    if (!enabled) {
      this.haltMusic();
      this.stopEffects();
      return;
    }

    this.pumpMusic();
  }

  private pumpMusic(): void {
    const scene = this.desiredMusic;
    if (!scene || !this.unlocked() || !this.settings.soundEnabled()) {
      return;
    }

    if (this.playingMusic === scene) {
      return;
    }

    const generation = this.musicGeneration;
    this.playingMusic = scene;
    this.activeMusic.set(scene);
    this.scheduleMusicLoop(scene, generation);
  }

  private scheduleMusicLoop(scene: AudioScene, generation: number): void {
    if (generation !== this.musicGeneration || this.playingMusic !== scene) {
      return;
    }

    const cue = AUDIO_LIBRARY[scene];
    const context = this.getContext();
    if (!context || !cue.loop || !this.musicGain) {
      return;
    }

    let offset = 0;
    let last: OscillatorNode | null = null;
    for (const step of cue.steps) {
      last = this.scheduleTone(context, step, offset, this.musicGain, 'music');
      offset += step.duration;
    }

    if (!last) {
      return;
    }

    const endNode = last;
    const previous = endNode.onended;
    endNode.onended = () => {
      if (typeof previous === 'function') {
        previous.call(endNode, new Event('ended'));
      }

      if (generation !== this.musicGeneration || this.playingMusic !== scene) {
        return;
      }

      if (!this.settings.soundEnabled() || !this.unlocked()) {
        return;
      }

      this.scheduleMusicLoop(scene, generation);
    };
  }

  private haltMusic(): void {
    this.musicGeneration += 1;
    this.playingMusic = null;
    this.activeMusic.set(null);
    this.stopGroup('music');
  }

  private stopEffects(): void {
    this.stopGroup('effect');
  }

  private scheduleTone(
    context: AudioContext,
    step: ToneStep,
    offsetSeconds: number,
    destination: AudioNode,
    group: 'music' | 'effect',
  ): OscillatorNode | null {
    try {
      const startAt = context.currentTime + offsetSeconds;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const attack = Math.min(0.01, step.duration / 3);
      const voice: LiveVoice = { group, oscillator, gain };

      oscillator.type = step.type;
      oscillator.frequency.setValueAtTime(step.frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(step.gain, startAt + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + step.duration);
      oscillator.connect(gain);
      gain.connect(destination);
      this.live.push(voice);
      oscillator.onended = () => this.release(voice);
      oscillator.start(startAt);
      oscillator.stop(startAt + step.duration);
      return oscillator;
    } catch {
      return null;
    }
  }

  private release(voice: LiveVoice): void {
    const index = this.live.indexOf(voice);
    if (index >= 0) {
      this.live.splice(index, 1);
    }

    try {
      voice.oscillator.disconnect();
      voice.gain.disconnect();
    } catch {
      // Node cleanup is best-effort and must not surface after playback.
    }
  }

  private stopGroup(group: 'music' | 'effect'): void {
    const staying: LiveVoice[] = [];
    const stopping: LiveVoice[] = [];
    for (const voice of this.live) {
      if (voice.group === group) {
        stopping.push(voice);
      } else {
        staying.push(voice);
      }
    }

    this.live.length = 0;
    this.live.push(...staying);
    for (const voice of stopping) {
      voice.oscillator.onended = null;
      try {
        voice.oscillator.stop();
      } catch {
        // The oscillator may already have reached its stop time.
      }
      try {
        voice.oscillator.disconnect();
        voice.gain.disconnect();
      } catch {
        // Node cleanup is best-effort and must not surface after playback.
      }
    }
  }

  private listenForUnlock(): () => void {
    if (typeof document === 'undefined') {
      return () => undefined;
    }

    const unlock = () => this.unlock();
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
    document.addEventListener('click', unlock, true);
    return () => {
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
      document.removeEventListener('click', unlock, true);
    };
  }

  private resume(): void {
    const context = this.audioContext;
    if (!context || context.state !== 'suspended') {
      return;
    }

    void context.resume().catch(() => undefined);
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
      return null;
    }

    try {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioContext();
        this.masterGain = null;
        this.musicGain = null;
      }

      this.ensureGraph(this.audioContext);
      this.resume();
      return this.audioContext;
    } catch {
      return null;
    }
  }

  private ensureGraph(context: AudioContext): void {
    if (this.masterGain && this.musicGain) {
      return;
    }

    const master = context.createGain();
    master.gain.setValueAtTime(this.outputGain, context.currentTime);
    master.connect(context.destination);

    const music = context.createGain();
    music.gain.setValueAtTime(MUSIC_LEVEL, context.currentTime);
    music.connect(master);

    this.masterGain = master;
    this.musicGain = music;
  }

  private currentOutputGain(): number {
    if (!this.settings.soundEnabled()) {
      return 0;
    }

    return clampVolume(this.settings.volume());
  }

  private now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
}
