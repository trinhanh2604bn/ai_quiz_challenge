export const AUDIO_SCENES = ['menu', 'quiz', 'battle'] as const;

export type AudioScene = (typeof AUDIO_SCENES)[number];

export const SOUND_CUE_IDS = [
  'menu',
  'quiz',
  'battle',
  'button',
  'selection',
  'correct',
  'wrong',
  'timeout',
  'warning',
  'complete',
  'achievement',
  'turn',
  'victory',
] as const;

export type SoundCueId = (typeof SOUND_CUE_IDS)[number];

export type SoundGroup = 'music' | 'effect' | 'ui' | 'battle';

export type AudioPlaybackState = AudioContextState | 'unavailable';

export interface ToneStep {
  frequency: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

export interface SoundCue {
  id: SoundCueId;
  group: SoundGroup;
  loop: boolean;
  steps: readonly ToneStep[];
}
