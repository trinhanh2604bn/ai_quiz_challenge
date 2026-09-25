import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { AppErrorService } from './app-error.service';

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private readonly errors = inject(AppErrorService);
  private readonly zone = inject(NgZone);

  handleError(error: unknown): void {
    console.error(error);
    queueMicrotask(() => {
      this.zone.run(() => this.errors.report());
    });
  }
}
