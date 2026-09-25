import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from '../../../core/storage/storage.service';
import {
  DEFAULT_GAME_SETTINGS,
  GAME_LANGUAGES,
  GameLanguage,
  GameSettings,
  clampVolume,
} from '../models/game-settings.model';

export const SETTINGS_STORAGE_KEY = 'ai-quiz-game-settings';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly storage = inject(StorageService);
  private readonly settingsState = signal<GameSettings>(this.readStoredSettings());

  readonly settings = this.settingsState.asReadonly();
  readonly soundEnabled = computed(() => this.settingsState().soundEnabled);
  readonly animationEnabled = computed(() => this.settingsState().animationEnabled);
  readonly language = computed(() => this.settingsState().language);
  readonly volume = computed(() => this.settingsState().volume);

  updateSettings(partial: Partial<GameSettings>): void {
    const next: GameSettings = { ...this.settingsState(), ...partial };
    next.volume = clampVolume(next.volume);
    this.persist(next);
  }

  toggleSound(): void {
    this.updateSettings({ soundEnabled: !this.settingsState().soundEnabled });
  }

  toggleAnimation(): void {
    this.updateSettings({ animationEnabled: !this.settingsState().animationEnabled });
  }

  resetSettings(): void {
    this.persist({ ...DEFAULT_GAME_SETTINGS });
  }

  private persist(settings: GameSettings): void {
    this.settingsState.set(settings);
    this.storage.writeJson(SETTINGS_STORAGE_KEY, settings);
  }

  private readStoredSettings(): GameSettings {
    return (
      this.storage.readJson(SETTINGS_STORAGE_KEY, normalizeSettings).value ?? {
        ...DEFAULT_GAME_SETTINGS,
      }
    );
  }
}

function isGameLanguage(value: unknown): value is GameLanguage {
  return typeof value === 'string' && GAME_LANGUAGES.some((language) => language === value);
}

function normalizeSettings(value: unknown): GameSettings | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const settings = value as Record<string, unknown>;
  if (typeof settings['soundEnabled'] !== 'boolean' || typeof settings['animationEnabled'] !== 'boolean') {
    return null;
  }

  if (!isGameLanguage(settings['language'])) {
    return null;
  }

  return {
    soundEnabled: settings['soundEnabled'],
    animationEnabled: settings['animationEnabled'],
    language: settings['language'],
    volume: clampVolume(settings['volume']),
  };
}
