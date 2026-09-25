export const BATTLE_STATES = ['waiting', 'player-turn', 'transition', 'completed'] as const;

export type BattleState = (typeof BATTLE_STATES)[number];
