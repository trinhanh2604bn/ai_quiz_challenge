import { RANK_TIERS, RankTier } from '../models/rank-tier.model';

export const TIER_RULES: readonly { tier: RankTier; minimumScore: number }[] = [
  { tier: 'Master AI', minimumScore: 200 },
  { tier: 'Platinum AI', minimumScore: 150 },
  { tier: 'Gold AI', minimumScore: 100 },
  { tier: 'Silver AI', minimumScore: 50 },
  { tier: 'Bronze AI', minimumScore: 0 },
];

export function tierForScore(score: number): RankTier {
  const value = Number.isFinite(score) ? Math.floor(score) : 0;
  for (const rule of TIER_RULES) {
    if (value >= rule.minimumScore) {
      return rule.tier;
    }
  }

  return RANK_TIERS[0];
}
