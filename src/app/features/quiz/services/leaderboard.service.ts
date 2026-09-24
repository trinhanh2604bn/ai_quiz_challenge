import { Injectable, signal } from '@angular/core';
import { LeaderboardEntry } from '../models/leaderboard-entry.model';

const STORAGE_KEY = 'ai-quiz-leaderboard';
const MAX_ENTRIES = 5;

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
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
    this.writeStoredEntries(nextEntries);
  }

  private readStoredEntries(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter(isLeaderboardEntry)
        .sort((left, right) => right.score - left.score || right.completedAt - left.completedAt)
        .slice(0, MAX_ENTRIES);
    } catch {
      return [];
    }
  }

  private writeStoredEntries(entries: readonly LeaderboardEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      return;
    }
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
