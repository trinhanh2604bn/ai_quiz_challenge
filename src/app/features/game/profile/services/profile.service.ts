import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from '../../../../core/storage/storage.service';
import {
  QUESTION_CATEGORIES,
  QuestionCategory,
  isQuestionCategory,
} from '../../../quiz/models/question.model';
import { BattleSession } from '../../models/battle-session.model';
import { avatarById } from '../data/avatars.data';
import {
  XP_AWARDS,
  battleExperience,
  levelForExperience,
  quizExperience,
  wholeNumber,
} from '../data/progression.data';
import {
  PROFILE_NICKNAME_MAX_LENGTH,
  BattleProgressFacts,
  PlayerProfile,
  PlayerStatistics,
  ProfileUpdate,
  QuizProgressFacts,
} from '../models/player-profile.model';

export const PROFILE_STORAGE_KEY = 'ai-player-profile';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly storage = inject(StorageService);
  private readonly profileState = signal<PlayerProfile | null>(this.readProfile());

  readonly profile = this.profileState.asReadonly();
  readonly hasProfile = computed(() => this.profileState() !== null);

  createProfile(nickname: string, avatarId: string): PlayerProfile | null {
    if (this.profileState() !== null) {
      return null;
    }

    const name = nickname.trim();
    if (name.length === 0 || name.length > PROFILE_NICKNAME_MAX_LENGTH || !avatarById(avatarId)) {
      return null;
    }

    const now = Date.now();
    const profile: PlayerProfile = {
      nickname: name,
      avatarId,
      level: 1,
      experience: 0,
      statistics: emptyStatistics(),
      createdAt: now,
      updatedAt: now,
      seenQuizIds: [],
      seenBattleIds: [],
      seenAchievementIds: [],
    };
    this.commit(profile);
    return profile;
  }

  recordQuizCompletion(facts: QuizProgressFacts): ProfileUpdate | null {
    const profile = this.profileState();
    if (!profile || !Number.isFinite(facts.completedAt)) {
      return null;
    }

    if (profile.seenQuizIds.includes(facts.completedAt)) {
      return null;
    }

    const questions = wholeNumber(facts.totalQuestions);
    const correct = Math.min(wholeNumber(facts.correctCount), questions);
    return this.apply(
      profile,
      quizExperience(questions, correct),
      applySession(profile.statistics, {
        kind: 'solo',
        category: isQuestionCategory(facts.category) ? facts.category : null,
        score: facts.score,
        maxStreak: facts.maxStreak,
        questions,
        correct,
        won: false,
        lost: false,
      }),
      {
        seenQuizIds: [...profile.seenQuizIds, facts.completedAt],
      },
    );
  }

  recordBattleCompletion(facts: BattleProgressFacts): ProfileUpdate | null {
    const profile = this.profileState();
    const signature = facts.signature.trim();
    if (!profile || signature.length === 0 || profile.seenBattleIds.includes(signature)) {
      return null;
    }

    const questions = wholeNumber(facts.questionsAnswered);
    const correct = Math.min(wholeNumber(facts.correctCount), questions);
    const won = facts.won;
    const lost = !won && facts.lost;
    return this.apply(
      profile,
      battleExperience(correct, won),
      applySession(profile.statistics, {
        kind: 'battle',
        category: isQuestionCategory(facts.category) ? facts.category : null,
        score: facts.score,
        maxStreak: facts.maxStreak,
        questions,
        correct,
        won,
        lost,
      }),
      {
        seenBattleIds: [...profile.seenBattleIds, signature],
      },
    );
  }

  recordAchievementUnlocks(ids: readonly string[]): ProfileUpdate | null {
    const profile = this.profileState();
    if (!profile) {
      return null;
    }

    const fresh = [
      ...new Set(
        ids
          .map((id) => id.trim())
          .filter((id) => id.length > 0 && !profile.seenAchievementIds.includes(id)),
      ),
    ];
    if (fresh.length === 0) {
      return null;
    }

    return this.apply(profile, fresh.length * XP_AWARDS.achievementUnlocked, profile.statistics, {
      seenAchievementIds: [...profile.seenAchievementIds, ...fresh],
    });
  }

  private apply(
    profile: PlayerProfile,
    experienceGained: number,
    statistics: PlayerStatistics,
    seen: Partial<Pick<PlayerProfile, 'seenQuizIds' | 'seenBattleIds' | 'seenAchievementIds'>>,
  ): ProfileUpdate {
    const gained = wholeNumber(experienceGained);
    const experience = profile.experience + gained;
    const level = levelForExperience(experience);
    const next: PlayerProfile = {
      ...profile,
      experience,
      level,
      statistics,
      updatedAt: Date.now(),
      seenQuizIds: seen.seenQuizIds ?? profile.seenQuizIds,
      seenBattleIds: seen.seenBattleIds ?? profile.seenBattleIds,
      seenAchievementIds: seen.seenAchievementIds ?? profile.seenAchievementIds,
    };
    this.commit(next);
    return {
      experienceGained: gained,
      level,
      previousLevel: profile.level,
      leveledUp: level > profile.level,
    };
  }

  private commit(profile: PlayerProfile): void {
    this.profileState.set(profile);
    this.storage.writeJson(PROFILE_STORAGE_KEY, profile);
  }

  private readProfile(): PlayerProfile | null {
    return this.storage.readJson(PROFILE_STORAGE_KEY, (parsed) => {
      if (typeof parsed !== 'object' || parsed === null) {
        return null;
      }

      return normalizeProfile(parsed as Record<string, unknown>);
    }).value;
  }
}

export function battleProgressFacts(
  session: BattleSession,
  signature: string,
): BattleProgressFacts {
  const [localPlayer, opponent] = session.players;
  return {
    signature,
    category: session.questions[0]?.category ?? null,
    score: localPlayer.score,
    maxStreak: localPlayer.bestStreak,
    questionsAnswered: localPlayer.answers.length,
    correctCount: localPlayer.correctAnswers,
    won: localPlayer.score > opponent.score,
    lost: localPlayer.score < opponent.score,
  };
}

interface SessionStatInput {
  kind: 'solo' | 'battle';
  category: QuestionCategory | null;
  score: number;
  maxStreak: number;
  questions: number;
  correct: number;
  won: boolean;
  lost: boolean;
}

function applySession(stats: PlayerStatistics, session: SessionStatInput): PlayerStatistics {
  const soloGames = stats.soloGames + (session.kind === 'solo' ? 1 : 0);
  const battleGames = stats.battleGames + (session.kind === 'battle' ? 1 : 0);
  const questionsAnswered = stats.questionsAnswered + session.questions;
  const correctAnswers = stats.correctAnswers + session.correct;
  const categorized = addCategory(stats, session.category);
  return {
    ...categorized,
    totalGames: soloGames + battleGames,
    wins: stats.wins + (session.kind === 'battle' && session.won ? 1 : 0),
    losses: stats.losses + (session.kind === 'battle' && session.lost ? 1 : 0),
    questionsAnswered,
    correctAnswers,
    accuracy: accuracyPercent(correctAnswers, questionsAnswered),
    bestScore: Math.max(stats.bestScore, wholeNumber(session.score)),
    bestStreak: Math.max(stats.bestStreak, wholeNumber(session.maxStreak)),
    soloGames,
    battleGames,
  };
}

function addCategory(stats: PlayerStatistics, category: QuestionCategory | null): PlayerStatistics {
  if (!category) {
    return stats;
  }

  const categoryCounts = {
    ...stats.categoryCounts,
    [category]: (stats.categoryCounts[category] ?? 0) + 1,
  };
  const currentCount = stats.favoriteCategory ? (categoryCounts[stats.favoriteCategory] ?? 0) : -1;
  const favoriteCategory =
    categoryCounts[category] > currentCount ? category : (stats.favoriteCategory ?? category);
  return { ...stats, categoryCounts, favoriteCategory };
}

function accuracyPercent(correct: number, questions: number): number {
  if (questions <= 0) {
    return 0;
  }

  return Math.round((correct / questions) * 100);
}

function emptyStatistics(): PlayerStatistics {
  return {
    totalGames: 0,
    wins: 0,
    losses: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    accuracy: 0,
    bestScore: 0,
    bestStreak: 0,
    favoriteCategory: null,
    soloGames: 0,
    battleGames: 0,
    categoryCounts: {},
  };
}

function normalizeProfile(value: Record<string, unknown>): PlayerProfile | null {
  const nickname = typeof value['nickname'] === 'string' ? value['nickname'].trim() : '';
  const avatarId = typeof value['avatarId'] === 'string' ? value['avatarId'] : '';
  if (
    nickname.length === 0 ||
    nickname.length > PROFILE_NICKNAME_MAX_LENGTH ||
    !avatarById(avatarId)
  ) {
    return null;
  }

  const experience = wholeNumber(typeof value['experience'] === 'number' ? value['experience'] : 0);
  return {
    nickname,
    avatarId,
    experience,
    level: levelForExperience(experience),
    statistics: normalizeStatistics(value['statistics']),
    createdAt: timestamp(value['createdAt']),
    updatedAt: timestamp(value['updatedAt']),
    seenQuizIds: numbers(value['seenQuizIds']),
    seenBattleIds: strings(value['seenBattleIds']),
    seenAchievementIds: strings(value['seenAchievementIds']),
  };
}

function normalizeStatistics(value: unknown): PlayerStatistics {
  if (typeof value !== 'object' || value === null) {
    return emptyStatistics();
  }

  const stored = value as Record<string, unknown>;
  const questionsAnswered = count(stored['questionsAnswered']);
  const correctAnswers = Math.min(count(stored['correctAnswers']), questionsAnswered);
  const soloGames = count(stored['soloGames']);
  const battleGames = count(stored['battleGames']);
  let wins = count(stored['wins']);
  let losses = count(stored['losses']);
  if (wins + losses > battleGames) {
    wins = Math.min(wins, battleGames);
    losses = Math.min(losses, battleGames - wins);
  }

  const categoryCounts = categoryCountMap(stored['categoryCounts']);
  return {
    totalGames: soloGames + battleGames,
    wins,
    losses,
    questionsAnswered,
    correctAnswers,
    accuracy: accuracyPercent(correctAnswers, questionsAnswered),
    bestScore: count(stored['bestScore']),
    bestStreak: count(stored['bestStreak']),
    favoriteCategory: favoriteCategory(stored['favoriteCategory'], categoryCounts),
    soloGames,
    battleGames,
    categoryCounts,
  };
}

function favoriteCategory(
  value: unknown,
  counts: Readonly<Record<string, number>>,
): QuestionCategory | null {
  if (isQuestionCategory(value)) {
    return value;
  }

  let best: QuestionCategory | null = null;
  let bestCount = 0;
  for (const category of QUESTION_CATEGORIES) {
    const played = counts[category] ?? 0;
    if (played > bestCount) {
      best = category;
      bestCount = played;
    }
  }

  return best;
}

function categoryCountMap(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null) {
    return {};
  }

  const counts: Record<string, number> = {};
  for (const [key, countValue] of Object.entries(value)) {
    if (isQuestionCategory(key)) {
      counts[key] = count(countValue);
    }
  }

  return counts;
}

function count(value: unknown): number {
  return wholeNumber(typeof value === 'number' ? value : 0);
}

function timestamp(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function numbers(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item));
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}
