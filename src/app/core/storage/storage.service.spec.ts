import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.removeItem('ai-quiz-storage-spec');
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    localStorage.removeItem('ai-quiz-storage-spec');
  });

  it('round-trips JSON that passes validation', () => {
    expect(service.writeJson('ai-quiz-storage-spec', { ok: true })).toBeTrue();

    const read = service.readJson('ai-quiz-storage-spec', (value) => {
      if (typeof value !== 'object' || value === null || !('ok' in value)) {
        return null;
      }

      return value as { ok: boolean };
    });

    expect(read).toEqual({ status: 'ok', value: { ok: true } });
  });

  it('reports a missing key without throwing', () => {
    expect(service.readJson('ai-quiz-storage-spec', () => null)).toEqual({
      status: 'missing',
      value: null,
    });
  });

  it('reports corrupt JSON and values that fail validation', () => {
    localStorage.setItem('ai-quiz-storage-spec', '{');
    expect(service.readJson('ai-quiz-storage-spec', () => ({ ok: true }))).toEqual({
      status: 'invalid',
      value: null,
    });

    localStorage.setItem('ai-quiz-storage-spec', 'null');
    expect(
      service.readJson('ai-quiz-storage-spec', (value) =>
        typeof value === 'object' && value !== null ? value : null,
      ),
    ).toEqual({ status: 'invalid', value: null });
  });

  it('returns false when the browser refuses a write', () => {
    spyOn(localStorage, 'setItem').and.throwError('quota');

    expect(service.writeJson('ai-quiz-storage-spec', { ok: true })).toBeFalse();
  });

  it('returns invalid when the browser refuses a read', () => {
    spyOn(localStorage, 'getItem').and.throwError('blocked');

    expect(service.readJson('ai-quiz-storage-spec', () => ({ ok: true }))).toEqual({
      status: 'invalid',
      value: null,
    });
  });
});
