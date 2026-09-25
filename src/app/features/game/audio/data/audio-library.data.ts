import { SoundCue, SoundCueId, SoundGroup, ToneStep } from '../models/sound-cue.model';

const menu: readonly ToneStep[] = [
  { frequency: 261.63, duration: 0.5, type: 'sine', gain: 0.05 },
  { frequency: 329.63, duration: 0.5, type: 'sine', gain: 0.05 },
  { frequency: 392, duration: 0.5, type: 'sine', gain: 0.045 },
  { frequency: 329.63, duration: 0.5, type: 'triangle', gain: 0.04 },
];

const quiz: readonly ToneStep[] = [
  { frequency: 220, duration: 0.42, type: 'triangle', gain: 0.04 },
  { frequency: 261.63, duration: 0.42, type: 'sine', gain: 0.045 },
  { frequency: 329.63, duration: 0.42, type: 'sine', gain: 0.04 },
  { frequency: 261.63, duration: 0.42, type: 'triangle', gain: 0.04 },
];

const battle: readonly ToneStep[] = [
  { frequency: 146.83, duration: 0.34, type: 'triangle', gain: 0.05 },
  { frequency: 220, duration: 0.34, type: 'sine', gain: 0.045 },
  { frequency: 174.61, duration: 0.34, type: 'triangle', gain: 0.05 },
  { frequency: 196, duration: 0.34, type: 'sine', gain: 0.04 },
];

function cue(id: SoundCueId, group: SoundGroup, loop: boolean, steps: readonly ToneStep[]): SoundCue {
  return { id, group, loop, steps };
}

export const AUDIO_LIBRARY: Readonly<Record<SoundCueId, SoundCue>> = {
  menu: cue('menu', 'music', true, menu),
  quiz: cue('quiz', 'music', true, quiz),
  battle: cue('battle', 'music', true, battle),
  button: cue('button', 'ui', false, [{ frequency: 988, duration: 0.045, type: 'sine', gain: 0.07 }]),
  selection: cue('selection', 'ui', false, [
    { frequency: 659.25, duration: 0.05, type: 'sine', gain: 0.08 },
    { frequency: 880, duration: 0.06, type: 'sine', gain: 0.08 },
  ]),
  correct: cue('correct', 'effect', false, [
    { frequency: 523.25, duration: 0.09, type: 'sine', gain: 0.12 },
    { frequency: 659.25, duration: 0.14, type: 'sine', gain: 0.12 },
  ]),
  wrong: cue('wrong', 'effect', false, [
    { frequency: 174.61, duration: 0.18, type: 'triangle', gain: 0.08 },
  ]),
  timeout: cue('timeout', 'effect', false, [
    { frequency: 196, duration: 0.12, type: 'triangle', gain: 0.08 },
    { frequency: 146.83, duration: 0.16, type: 'triangle', gain: 0.07 },
  ]),
  warning: cue('warning', 'effect', false, [{ frequency: 880, duration: 0.07, type: 'sine', gain: 0.1 }]),
  complete: cue('complete', 'effect', false, [
    { frequency: 523.25, duration: 0.1, type: 'sine', gain: 0.12 },
    { frequency: 659.25, duration: 0.1, type: 'sine', gain: 0.12 },
    { frequency: 783.99, duration: 0.1, type: 'sine', gain: 0.12 },
    { frequency: 1046.5, duration: 0.18, type: 'sine', gain: 0.12 },
  ]),
  achievement: cue('achievement', 'effect', false, [
    { frequency: 880, duration: 0.08, type: 'sine', gain: 0.1 },
    { frequency: 1174.66, duration: 0.14, type: 'sine', gain: 0.1 },
  ]),
  turn: cue('turn', 'battle', false, [
    { frequency: 523.25, duration: 0.06, type: 'sine', gain: 0.1 },
    { frequency: 783.99, duration: 0.08, type: 'sine', gain: 0.1 },
  ]),
  victory: cue('victory', 'battle', false, [
    { frequency: 523.25, duration: 0.1, type: 'sine', gain: 0.12 },
    { frequency: 659.25, duration: 0.1, type: 'sine', gain: 0.12 },
    { frequency: 783.99, duration: 0.1, type: 'sine', gain: 0.12 },
    { frequency: 1046.5, duration: 0.2, type: 'sine', gain: 0.12 },
  ]),
};
