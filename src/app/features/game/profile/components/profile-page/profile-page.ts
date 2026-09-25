import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameBackgroundComponent } from '../../../components/game-background/game-background';
import { GameButtonComponent } from '../../../components/game-button/game-button';
import { GameCardComponent } from '../../../components/game-card/game-card';
import { AudioService } from '../../../audio/services/audio.service';
import { RankBadgeComponent } from '../../../ranking/components/rank-badge/rank-badge';
import { RankingService } from '../../../ranking/services/ranking.service';
import { ProfileService } from '../../services/profile.service';
import { ProfileCardComponent } from '../profile-card/profile-card';
import { XpBarComponent } from '../xp-bar/xp-bar';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile-page',
  imports: [
    GameBackgroundComponent,
    GameButtonComponent,
    GameCardComponent,
    ProfileCardComponent,
    XpBarComponent,
    RankBadgeComponent,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePageComponent implements OnInit {
  private readonly profiles = inject(ProfileService);
  private readonly rankings = inject(RankingService);
  private readonly audio = inject(AudioService);
  private readonly router = inject(Router);

  readonly player = this.profiles.profile;
  readonly tier = computed(() => {
    this.rankings.entries();
    return this.rankings.getTier();
  });
  readonly rank = computed(() => {
    this.rankings.entries();
    return this.rankings.calculateRank();
  });

  ngOnInit(): void {
    if (!this.player()) {
      void this.router.navigate(['/profile/create']);
    }
  }

  goHome(): void {
    this.audio.playButtonClick();
    void this.router.navigate(['/']);
  }

  formatDate(timestamp: number): string {
    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      return 'Unknown';
    }

    return new Date(timestamp).toLocaleDateString();
  }
}
