import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from '../../../core/storage/storage.service';
import { LeaderboardEntry } from '../models/leaderboard-entry.model';

const STORAGE_KEY = 'ai-quiz-leaderboard';
const MAX_ENTRIES = 10;

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  private readonly storage = inject(StorageService);
  private readonly entriesState = signal<readonly LeaderboardEntry[]>(this.readStoredEntries());

  readonly entries = this.entriesState.asReadonly();

  addEntry(entry: LeaderboardEntry): void {
    const playerName = entry.playerName.trim();
    if (playerName.length === 0) {
      return;
    }

    const nextEntries = [...this.entriesState(), { ...entry, playerName }]
      .sort((left, right) => right.score - left.score || right.completedAt - left.completedAt)
      .slice(0, MAX_ENTRIES);

    this.entriesState.set(nextEntries);
    this.storage.writeJson(STORAGE_KEY, nextEntries);
  }

  private readStoredEntries(): LeaderboardEntry[] {
    const stored = this.storage.readJson(STORAGE_KEY, (parsed): LeaderboardEntry[] | null => {
      if (!Array.isArray(parsed)) {
        return null;
      }

      return parsed
        .filter(isLeaderboardEntry)
        .map(normalizeEntry)
        .sort((left, right) => right.score - left.score || right.completedAt - left.completedAt)
        .slice(0, MAX_ENTRIES);
    });
    return stored.value ?? [];
  }
}

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    typeof entry['playerName'] === 'string' &&
    typeof entry['score'] === 'number' &&
    typeof entry['accuracy'] === 'number' &&
    typeof entry['completedAt'] === 'number'
  );
}

function normalizeEntry(entry: LeaderboardEntry): LeaderboardEntry {
  if (entry.mode === 'single-player' || entry.mode === 'two-player') {
    return entry;
  }

  if (entry.mode === undefined) {
    return entry;
  }

  const { mode: _mode, ...rest } = entry;
  return rest;
}
