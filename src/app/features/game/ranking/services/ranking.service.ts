import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from '../../../../core/storage/storage.service';
import { QuestionCategory, isQuestionCategory } from '../../../quiz/models/question.model';
import { GAME_MODES, GameMode } from '../../models/game-mode.model';
import { avatarById } from '../../profile/data/avatars.data';
import { ProfileService } from '../../profile/services/profile.service';
import { DEFAULT_SEASON } from '../data/seasons.data';
import { tierForScore } from '../data/tiers.data';
import { PlayerStanding, RankingEntry, RankingRecord } from '../models/ranking-entry.model';
import { RankTier } from '../models/rank-tier.model';
import { Season } from '../models/season.model';

export const RANKING_STORAGE_KEY = 'ai-quiz-ranking';
export const SEASON_STORAGE_KEY = 'ai-quiz-active-season';

const PLAYER_MAX_LENGTH = 32;
const SOURCE_MAX_LENGTH = 4000;
const SEASON_ID_MAX_LENGTH = 40;
const SEASON_NAME_MAX_LENGTH = 48;

@Injectable({
  providedIn: 'root',
})
export class RankingService {
  private readonly storage = inject(StorageService);
  private readonly profiles = inject(ProfileService);
  private readonly seasonState = signal<Season>(loadSeason(this.storage));
  private readonly entriesState = signal<readonly RankingEntry[]>(readStoredEntries(this.storage));

  readonly activeSeason = this.seasonState.asReadonly();
  readonly entries = this.entriesState.asReadonly();

  getGlobalRanking(): readonly PlayerStanding[] {
    return standingsFrom(this.entriesState());
  }

  getSeasonRanking(seasonId?: string): readonly PlayerStanding[] {
    const id = (seasonId ?? this.seasonState().id).trim();
    if (id.length === 0) {
      return [];
    }

    return standingsFrom(this.entriesState().filter((entry) => entry.seasonId === id));
  }

  getCategoryRanking(category: QuestionCategory): readonly PlayerStanding[] {
    if (!isQuestionCategory(category)) {
      return [];
    }

    return standingsFrom(this.entriesState().filter((entry) => entry.category === category));
  }

  calculateRank(player?: string): number | null {
    const name = (player ?? this.profiles.profile()?.nickname ?? '').trim();
    if (name.length === 0) {
      return null;
    }

    return this.getGlobalRanking().find((row) => row.player === name)?.rank ?? null;
  }

  getTier(score?: number): RankTier | null {
    if (score !== undefined) {
      if (!Number.isFinite(score)) {
        return null;
      }

      return tierForScore(score);
    }

    const name = this.profiles.profile()?.nickname;
    if (!name) {
      return null;
    }

    return this.getGlobalRanking().find((row) => row.player === name)?.tier ?? null;
  }

  recordResult(record: RankingRecord): RankingEntry | null {
    const next = this.normalizeRecord(record);
    if (!next) {
      return null;
    }

    if (this.entriesState().some((entry) => entry.sourceId === next.sourceId)) {
      return null;
    }

    const entries = [...this.entriesState(), next];
    this.entriesState.set(entries);
    writeStoredEntries(this.storage, entries);
    return next;
  }

  setActiveSeason(season: Season): Season | null {
    const next = normalizeSeason(season);
    if (!next) {
      return null;
    }

    this.seasonState.set(next);
    writeStoredSeason(this.storage, next);
    return next;
  }

  private normalizeRecord(record: RankingRecord): RankingEntry | null {
    const sourceId = record.sourceId.trim();
    const player = record.player.trim();
    if (
      sourceId.length === 0 ||
      sourceId.length > SOURCE_MAX_LENGTH ||
      player.length === 0 ||
      player.length > PLAYER_MAX_LENGTH ||
      !isQuestionCategory(record.category) ||
      !isMode(record.mode) ||
      !Number.isFinite(record.score) ||
      !Number.isFinite(record.recordedAt)
    ) {
      return null;
    }

    const avatar = typeof record.avatarId === 'string' ? record.avatarId : '';
    return {
      sourceId,
      player,
      avatarId: avatarById(avatar) ? avatar : '',
      level: nonNegative(record.level),
      experience: nonNegative(record.experience),
      score: nonNegative(record.score),
      category: record.category,
      mode: record.mode,
      seasonId: this.seasonState().id,
      recordedAt: record.recordedAt,
    };
  }
}

function standingsFrom(entries: readonly RankingEntry[]): PlayerStanding[] {
  const best = new Map<string, RankingEntry>();
  for (const entry of entries) {
    const current = best.get(entry.player);
    if (!current || betterEntry(entry, current)) {
      best.set(entry.player, entry);
    }
  }

  return [...best.values()].sort(comparePlayers).map((entry, index) => ({
    rank: index + 1,
    player: entry.player,
    avatarId: entry.avatarId,
    level: entry.level,
    experience: entry.experience,
    score: entry.score,
    category: entry.category,
    mode: entry.mode,
    seasonId: entry.seasonId,
    tier: tierForScore(entry.score),
    recordedAt: entry.recordedAt,
  }));
}

function betterEntry(candidate: RankingEntry, current: RankingEntry): boolean {
  return comparePlayers(candidate, current) < 0;
}

function comparePlayers(left: RankingEntry, right: RankingEntry): number {
  return (
    right.score - left.score ||
    right.experience - left.experience ||
    right.level - left.level ||
    right.recordedAt - left.recordedAt ||
    left.player.localeCompare(right.player)
  );
}

function loadSeason(storage: StorageService): Season {
  const stored = readStoredSeason(storage);
  if (stored) {
    return stored;
  }

  writeStoredSeason(storage, DEFAULT_SEASON);
  return DEFAULT_SEASON;
}

function readStoredSeason(storage: StorageService): Season | null {
  return storage.readJson(SEASON_STORAGE_KEY, (parsed) => {
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    return normalizeSeason(parsed as Season);
  }).value;
}

function writeStoredSeason(storage: StorageService, season: Season): void {
  storage.writeJson(SEASON_STORAGE_KEY, season);
}

function normalizeSeason(value: Season): Season | null {
  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const startedAt = value.startedAt;
  if (
    id.length === 0 ||
    id.length > SEASON_ID_MAX_LENGTH ||
    name.length === 0 ||
    name.length > SEASON_NAME_MAX_LENGTH ||
    typeof startedAt !== 'number' ||
    !Number.isFinite(startedAt) ||
    startedAt < 0
  ) {
    return null;
  }

  return { id, name, startedAt };
}

function readStoredEntries(storage: StorageService): RankingEntry[] {
  return (
    storage.readJson(RANKING_STORAGE_KEY, (parsed) => {
      if (!Array.isArray(parsed)) {
        return null;
      }

      const entries: RankingEntry[] = [];
      for (const value of parsed) {
        const entry = normalizeStoredEntry(value);
        if (entry && !entries.some((current) => current.sourceId === entry.sourceId)) {
          entries.push(entry);
        }
      }

      return entries;
    }).value ?? []
  );
}

function writeStoredEntries(storage: StorageService, entries: readonly RankingEntry[]): void {
  storage.writeJson(RANKING_STORAGE_KEY, entries);
}

function normalizeStoredEntry(value: unknown): RankingEntry | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const entry = value as Record<string, unknown>;
  const sourceId = typeof entry['sourceId'] === 'string' ? entry['sourceId'].trim() : '';
  const player = typeof entry['player'] === 'string' ? entry['player'].trim() : '';
  const seasonId = typeof entry['seasonId'] === 'string' ? entry['seasonId'].trim() : '';
  const category = entry['category'];
  const mode = entry['mode'];
  if (
    sourceId.length === 0 ||
    sourceId.length > SOURCE_MAX_LENGTH ||
    player.length === 0 ||
    player.length > PLAYER_MAX_LENGTH ||
    seasonId.length === 0 ||
    !isQuestionCategory(category) ||
    !isMode(mode) ||
    typeof entry['score'] !== 'number' ||
    typeof entry['recordedAt'] !== 'number' ||
    !Number.isFinite(entry['recordedAt'])
  ) {
    return null;
  }

  const avatarId = typeof entry['avatarId'] === 'string' ? entry['avatarId'] : '';
  return {
    sourceId,
    player,
    avatarId: avatarById(avatarId) ? avatarId : '',
    level: nonNegative(entry['level']),
    experience: nonNegative(entry['experience']),
    score: nonNegative(entry['score']),
    category,
    mode,
    seasonId,
    recordedAt: entry['recordedAt'],
  };
}

function nonNegative(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}

function isMode(value: unknown): value is GameMode {
  return GAME_MODES.some((mode) => mode === value);
}
