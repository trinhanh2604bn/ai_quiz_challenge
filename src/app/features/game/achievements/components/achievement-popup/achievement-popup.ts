import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { GameCardComponent } from '../../../components/game-card/game-card';
import { AudioService } from '../../../audio/services/audio.service';
import { AchievementService } from '../../services/achievement.service';

export const ACHIEVEMENT_POPUP_MS = 3200;
const POPUP_HIDE_MS = 320;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-achievement-popup',
  imports: [GameCardComponent],
  templateUrl: './achievement-popup.html',
  styleUrl: './achievement-popup.scss',
})
export class AchievementPopupComponent {
  private readonly achievements = inject(AchievementService);
  private readonly audio = inject(AudioService);

  readonly achievement = this.achievements.activePopup;
  readonly hiding = signal(false);

  constructor() {
    effect((onCleanup) => {
      const current = this.achievements.activePopup();
      this.hiding.set(false);
      if (!current) {
        return;
      }

      untracked(() => this.audio.playAchievementSound());
      const hideTimer = setTimeout(() => this.hiding.set(true), ACHIEVEMENT_POPUP_MS);
      const dismissTimer = setTimeout(
        () => this.achievements.dismissPopup(),
        ACHIEVEMENT_POPUP_MS + POPUP_HIDE_MS,
      );
      onCleanup(() => {
        clearTimeout(hideTimer);
        clearTimeout(dismissTimer);
      });
    });
  }
}
