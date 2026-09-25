import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppErrorService {
  private readonly visibleState = signal(false);

  readonly visible = this.visibleState.asReadonly();

  report(): void {
    this.visibleState.set(true);
  }

  clear(): void {
    this.visibleState.set(false);
  }
}
