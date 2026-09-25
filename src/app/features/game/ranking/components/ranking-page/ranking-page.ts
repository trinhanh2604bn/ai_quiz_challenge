import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { QUESTION_CATEGORIES, QuestionCategory } from '../../../../quiz/models/question.model';
import { AudioService } from '../../../audio/services/audio.service';
import { GameBackgroundComponent } from '../../../components/game-background/game-background';
import { GameButtonComponent } from '../../../components/game-button/game-button';
import { GameCardComponent } from '../../../components/game-card/game-card';
import { avatarById } from '../../../profile/data/avatars.data';
import { ProfileService } from '../../../profile/services/profile.service';
import { GameMode } from '../../../models/game-mode.model';
import { RankingService } from '../../services/ranking.service';
import { RankBadgeComponent } from '../rank-badge/rank-badge';
import { SeasonCardComponent } from '../season-card/season-card';

type RankingBoard = 'global' | 'season' | 'category';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ranking-page',
  imports: [
    GameBackgroundComponent,
    GameButtonComponent,
    GameCardComponent,
    RankBadgeComponent,
    SeasonCardComponent,
  ],
  templateUrl: './ranking-page.html',
  styleUrl: './ranking-page.scss',
})
export class RankingPageComponent {
  private readonly rankings = inject(RankingService);
  private readonly profiles = inject(ProfileService);
  private readonly audio = inject(AudioService);
  private readonly router = inject(Router);

  readonly categories = QUESTION_CATEGORIES;
  readonly season = this.rankings.activeSeason;
  readonly player = this.profiles.profile;
  readonly board = signal<RankingBoard>('global');
  readonly category = signal<QuestionCategory>('AI Fundamentals');
  readonly standings = computed(() => {
    this.rankings.entries();
    this.rankings.activeSeason();
    const board = this.board();
    if (board === 'season') {
      return this.rankings.getSeasonRanking();
    }

    if (board === 'category') {
      return this.rankings.getCategoryRanking(this.category());
    }

    return this.rankings.getGlobalRanking();
  });

  showBoard(board: RankingBoard): void {
    this.audio.playButtonClick();
    this.board.set(board);
  }

  showCategory(category: QuestionCategory): void {
    this.audio.playButtonClick();
    this.board.set('category');
    this.category.set(category);
  }

  goHome(): void {
    this.audio.playButtonClick();
    void this.router.navigate(['/']);
  }

  glyphFor(avatarId: string, player: string): string {
    const avatar = avatarById(avatarId);
    if (avatar) {
      return avatar.glyph;
    }

    const letter = player.trim().charAt(0).toUpperCase();
    return letter || '?';
  }

  modeLabel(mode: GameMode): string {
    return mode === 'single-player' ? 'Solo' : 'Battle';
  }
}
