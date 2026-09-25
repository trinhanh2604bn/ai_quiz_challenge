export const GAME_LANGUAGES = ['en'] as const;

export type GameLanguage = (typeof GAME_LANGUAGES)[number];

export interface GameSettings {
  soundEnabled: boolean;
  animationEnabled: boolean;
  language: GameLanguage;
  volume: number;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  soundEnabled: true,
  animationEnabled: true,
  language: 'en',
  volume: 1,
};

export function clampVolume(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_GAME_SETTINGS.volume;
  }

  return Math.min(1, Math.max(0, value));
}
