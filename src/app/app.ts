import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationError, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AppErrorService } from './core/errors/app-error.service';
import { AchievementPopupComponent } from './features/game/achievements/components/achievement-popup/achievement-popup';
import { AudioService } from './features/game/audio/services/audio.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, AchievementPopupComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly errors = inject(AppErrorService);
  private readonly router = inject(Router);
  private recoveringNavigation = false;

  readonly showRecovery = this.errors.visible;

  constructor() {
    inject(AudioService);
    this.router.events
      .pipe(
        filter((event): event is NavigationError => event instanceof NavigationError),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.recoverNavigation(event));
  }

  dismissRecovery(): void {
    this.errors.clear();
  }

  private recoverNavigation(event: NavigationError): void {
    this.errors.report();
    if (this.recoveringNavigation || event.url === '/' || event.url.startsWith('/?')) {
      return;
    }

    this.recoveringNavigation = true;
    void this.router.navigateByUrl('/').finally(() => {
      this.recoveringNavigation = false;
    });
  }
}
