export const GAME_STATES = ['home', 'setup', 'playing', 'result', 'leaderboard'] as const;

export type GameState = (typeof GAME_STATES)[number];
