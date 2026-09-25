import { Injectable } from '@angular/core';

export type StorageReadStatus = 'missing' | 'ok' | 'invalid';

export interface StorageReadResult<T> {
  status: StorageReadStatus;
  value: T | null;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  readJson<T>(key: string, validate: (value: unknown) => T | null): StorageReadResult<T> {
    let raw: string | null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      return { status: 'invalid', value: null };
    }

    if (raw === null) {
      return { status: 'missing', value: null };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { status: 'invalid', value: null };
    }

    try {
      const value = validate(parsed);
      if (value === null) {
        return { status: 'invalid', value: null };
      }

      return { status: 'ok', value };
    } catch {
      return { status: 'invalid', value: null };
    }
  }

  writeJson(key: string, value: unknown): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
}
