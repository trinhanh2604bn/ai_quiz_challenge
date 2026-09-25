import { TestBed } from '@angular/core/testing';
import { AppErrorHandler } from './app-error.handler';
import { AppErrorService } from './app-error.service';

describe('AppErrorHandler', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppErrorHandler],
    });
  });

  it('records a recovery state without throwing', () => {
    const handler = TestBed.inject(AppErrorHandler);
    const errors = TestBed.inject(AppErrorService);
    spyOn(console, 'error');

    expect(() => handler.handleError(new Error('render failed'))).not.toThrow();

    return Promise.resolve().then(() => {
      expect(errors.visible()).toBeTrue();
      errors.clear();
      expect(errors.visible()).toBeFalse();
    });
  });
});
