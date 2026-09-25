export const GAME_MODES = ['single-player', 'two-player'] as const;

export type GameMode = (typeof GAME_MODES)[number];
