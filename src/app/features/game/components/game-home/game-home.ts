import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { LeaderboardComponent } from '../../../quiz/components/leaderboard/leaderboard';
import { LeaderboardService } from '../../../quiz/services/leaderboard.service';
import { keepFocusInside } from '../../../../core/a11y/focus-trap';
import { AudioService } from '../../audio/services/audio.service';
import { avatarById } from '../../profile/data/avatars.data';
import { levelProgress } from '../../profile/data/progression.data';
import { ProfileService } from '../../profile/services/profile.service';
import { GameService } from '../../services/game.service';
import { SettingsService } from '../../services/settings.service';
import { GameButtonComponent } from '../game-button/game-button';
import { SettingsModalComponent } from '../settings-modal/settings-modal';

const HOME_ASSET = 'game/home';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-game-home',
  imports: [SettingsModalComponent, LeaderboardComponent, GameButtonComponent],
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
  private readonly leaderboardCloseButton = viewChild('leaderboardClose', { read: ElementRef });
  private overlayOpener: HTMLElement | null = null;

  readonly entries = this.leaderboard.entries;
  readonly player = this.profiles.profile;
  readonly xp = computed(() => levelProgress(this.player()?.experience ?? 0));
  readonly avatarGlyph = computed(() => {
    const profile = this.player();
    if (!profile) {
      return '';
    }

    const avatar = avatarById(profile.avatarId);
    if (avatar) {
      return avatar.glyph;
    }

    const letter = profile.nickname.trim().charAt(0).toUpperCase();
    return letter || '?';
  });

  readonly mode = this.game.mode;
  readonly state = this.game.state;
  readonly soundEnabled = this.settings.soundEnabled;
  readonly settingsOpen = signal(false);
  readonly leaderboardOpen = signal(false);
  readonly logoSrc = `${HOME_ASSET}/game-logo.png`;
  readonly sloganSrc = `${HOME_ASSET}/slogan-banner.png`;
  readonly mascotSrc = `${HOME_ASSET}/mascot-wave.png`;
  readonly soloArtSrc = `${HOME_ASSET}/mode-solo.png`;
  readonly battleArtSrc = `${HOME_ASSET}/mode-battle.png`;
  readonly profileIconSrc = `${HOME_ASSET}/icon-profile.png`;
  readonly achievementsIconSrc = `${HOME_ASSET}/icon-achievements.png`;
  readonly rankingIconSrc = `${HOME_ASSET}/icon-ranking.png`;
  readonly leaderboardIconSrc = `${HOME_ASSET}/icon-leaderboard.png`;
  readonly settingsIconSrc = `${HOME_ASSET}/icon-settings.png`;
  readonly soundIconSrc = computed(() =>
    this.soundEnabled() ? `${HOME_ASSET}/icon-sound-on.png` : `${HOME_ASSET}/icon-sound-off.png`,
  );
  readonly soundLabel = computed(() => (this.soundEnabled() ? 'Sound on' : 'Sound off'));

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
