import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { LeaderboardComponent } from '../../../quiz/components/leaderboard/leaderboard';
import { LeaderboardService } from '../../../quiz/services/leaderboard.service';
import { AudioService } from '../../audio/services/audio.service';
import { ProfileCardComponent } from '../../profile/components/profile-card/profile-card';
import { XpBarComponent } from '../../profile/components/xp-bar/xp-bar';
import { ProfileService } from '../../profile/services/profile.service';
import { GameService } from '../../services/game.service';
import { SettingsService } from '../../services/settings.service';
import { GameBackgroundComponent } from '../game-background/game-background';
import { GameButtonComponent } from '../game-button/game-button';
import { GameCardComponent } from '../game-card/game-card';
import { SettingsModalComponent } from '../settings-modal/settings-modal';
import { keepFocusInside } from '../../../../core/a11y/focus-trap';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-game-home',
  imports: [
    SettingsModalComponent,
    LeaderboardComponent,
    GameBackgroundComponent,
    GameCardComponent,
    GameButtonComponent,
    ProfileCardComponent,
    XpBarComponent,
  ],
  templateUrl: './game-home.html',
  styleUrl: './game-home.scss',
})
export class GameHomeComponent {
  private readonly game = inject(GameService);
  private readonly settings = inject(SettingsService);
  private readonly audio = inject(AudioService);
  private readonly leaderboard = inject(LeaderboardService);
  private readonly profiles = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly leaderboardCloseButton = viewChild<ElementRef<HTMLElement>>('leaderboardClose');
  private overlayOpener: HTMLElement | null = null;

  readonly entries = this.leaderboard.entries;
  readonly player = this.profiles.profile;

  readonly mode = this.game.mode;
  readonly state = this.game.state;
  readonly soundEnabled = this.settings.soundEnabled;
  readonly settingsOpen = signal(false);
  readonly leaderboardOpen = signal(false);

  constructor() {
    this.audio.playMenuMusic();
    effect(() => {
      const host = this.leaderboardCloseButton()?.nativeElement;
      if (!host) {
        return;
      }

      const target = host instanceof HTMLButtonElement ? host : host.querySelector('button');
      target?.focus();
    });
  }

  chooseSinglePlayer(): void {
    this.audio.playButtonClick();
    this.game.setGameMode('single-player');
    this.game.changeState('setup');
    void this.router.navigate(['/setup']);
  }

  chooseTwoPlayer(): void {
    this.audio.playButtonClick();
    this.game.setGameMode('two-player');
    this.game.changeState('setup');
    void this.router.navigate(['/battle/setup']);
  }

  toggleSound(): void {
    this.audio.playButtonClick();
    this.settings.toggleSound();
  }

  openSettings(): void {
    this.audio.playButtonClick();
    this.rememberOverlayOpener();
    this.leaderboardOpen.set(false);
    this.settingsOpen.set(true);
  }

  closeSettings(): void {
    this.audio.playButtonClick();
    this.settingsOpen.set(false);
    this.restoreOverlayOpener();
  }

  openProfile(): void {
    this.audio.playButtonClick();
    this.settingsOpen.set(false);
    this.leaderboardOpen.set(false);
    void this.router.navigate(['/profile']);
  }

  openAchievements(): void {
    this.audio.playButtonClick();
    this.settingsOpen.set(false);
    this.leaderboardOpen.set(false);
    void this.router.navigate(['/achievements']);
  }

  openRanking(): void {
    this.audio.playButtonClick();
    this.settingsOpen.set(false);
    this.leaderboardOpen.set(false);
    void this.router.navigate(['/ranking']);
  }

  openLeaderboard(): void {
    this.audio.playButtonClick();
    this.rememberOverlayOpener();
    this.settingsOpen.set(false);
    this.leaderboardOpen.set(true);
  }

  closeLeaderboard(): void {
    this.audio.playButtonClick();
    this.leaderboardOpen.set(false);
    this.restoreOverlayOpener();
  }

  @HostListener('document:keydown.escape')
  closeOverlays(): void {
    if (!this.settingsOpen() && !this.leaderboardOpen()) {
      return;
    }

    this.settingsOpen.set(false);
    this.leaderboardOpen.set(false);
    this.restoreOverlayOpener();
  }

  private rememberOverlayOpener(): void {
    const active = document.activeElement;
    this.overlayOpener = active instanceof HTMLElement ? active : null;
  }

  private restoreOverlayOpener(): void {
    const opener = this.overlayOpener;
    this.overlayOpener = null;
    opener?.focus();
  }

  trapDialogFocus(event: KeyboardEvent): void {
    keepFocusInside(event);
  }
}
