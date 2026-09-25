import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameBackgroundComponent } from '../../../components/game-background/game-background';
import { GameButtonComponent } from '../../../components/game-button/game-button';
import { AchievementService } from '../../services/achievement.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-achievement-screen',
  imports: [GameBackgroundComponent, GameButtonComponent],
  templateUrl: './achievement-screen.html',
  styleUrl: './achievement-screen.scss',
})
export class AchievementScreenComponent {
  private readonly achievements = inject(AchievementService);
  private readonly router = inject(Router);

  readonly unlocked = this.achievements.unlocked;
  readonly locked = this.achievements.locked;
  readonly total = this.achievements.achievements;

  goHome(): void {
    void this.router.navigate(['/']);
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }
}
