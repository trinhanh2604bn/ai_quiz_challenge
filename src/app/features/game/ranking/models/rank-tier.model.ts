export const RANK_TIERS = [
  'Bronze AI',
  'Silver AI',
  'Gold AI',
  'Platinum AI',
  'Master AI',
] as const;

export type RankTier = (typeof RANK_TIERS)[number];
