import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { AudioService } from '../../audio/services/audio.service';
import { SettingsService } from '../../services/settings.service';
import { SettingsModalComponent } from '../settings-modal/settings-modal';

const HOME_ASSET = 'game/home';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-setup-toolbar',
  imports: [SettingsModalComponent],
  templateUrl: './setup-toolbar.html',
  styleUrl: './setup-toolbar.scss',
})
export class SetupToolbarComponent {
  private readonly settings = inject(SettingsService);
  private readonly audio = inject(AudioService);
  private overlayOpener: HTMLElement | null = null;

  readonly leave = output<void>();
  readonly settingsOpen = signal(false);
  readonly soundEnabled = this.settings.soundEnabled;
  readonly settingsIconSrc = `${HOME_ASSET}/icon-settings.png`;
  readonly soundIconSrc = computed(() =>
    this.soundEnabled() ? `${HOME_ASSET}/icon-sound-on.png` : `${HOME_ASSET}/icon-sound-off.png`,
  );
  readonly soundLabel = computed(() => (this.soundEnabled() ? 'Sound on' : 'Sound off'));

  goBack(): void {
    this.audio.playButtonClick();
    this.leave.emit();
  }

  toggleSound(): void {
    this.audio.playButtonClick();
    this.settings.toggleSound();
  }

  openSettings(event: Event): void {
    this.audio.playButtonClick();
    this.rememberOpener(event);
    this.settingsOpen.set(true);
  }

  closeSettings(): void {
    this.audio.playButtonClick();
    this.settingsOpen.set(false);
    this.restoreOpener();
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (!this.settingsOpen()) {
      return;
    }

    this.settingsOpen.set(false);
    this.restoreOpener();
  }

  private rememberOpener(event: Event): void {
    const current = event.currentTarget;
    this.overlayOpener = current instanceof HTMLElement ? current : null;
  }

  private restoreOpener(): void {
    const opener = this.overlayOpener;
    this.overlayOpener = null;
    opener?.focus();
  }
}
