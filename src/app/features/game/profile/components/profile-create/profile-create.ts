import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameBackgroundComponent } from '../../../components/game-background/game-background';
import { GameButtonComponent } from '../../../components/game-button/game-button';
import { GameCardComponent } from '../../../components/game-card/game-card';
import { AudioService } from '../../../audio/services/audio.service';
import { PROFILE_AVATARS } from '../../data/avatars.data';
import { PROFILE_NICKNAME_MAX_LENGTH } from '../../models/player-profile.model';
import { ProfileService } from '../../services/profile.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile-create',
  imports: [GameBackgroundComponent, GameButtonComponent, GameCardComponent],
  templateUrl: './profile-create.html',
  styleUrl: './profile-create.scss',
})
export class ProfileCreateComponent implements OnInit {
  private readonly profiles = inject(ProfileService);
  private readonly audio = inject(AudioService);
  private readonly router = inject(Router);

  readonly avatars = PROFILE_AVATARS;
  readonly nicknameMax = PROFILE_NICKNAME_MAX_LENGTH;
  readonly nickname = signal('');
  readonly avatarId = signal<string | null>(null);
  readonly rejected = signal(false);
  readonly canCreate = computed(
    () => this.nickname().trim().length > 0 && this.avatarId() !== null,
  );

  ngOnInit(): void {
    this.audio.playMenuMusic();
  }

  updateNickname(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.nickname.set(target.value.slice(0, this.nicknameMax));
    this.rejected.set(false);
  }

  selectAvatar(avatarId: string): void {
    this.audio.playSelection();
    this.avatarId.set(avatarId);
    this.rejected.set(false);
  }

  createProfile(): void {
    const avatarId = this.avatarId();
    if (!this.canCreate() || avatarId === null) {
      return;
    }

    this.audio.playButtonClick();
    const profile = this.profiles.createProfile(this.nickname(), avatarId);
    if (!profile) {
      this.rejected.set(true);
      return;
    }

    void this.router.navigate(['/']);
  }
}
