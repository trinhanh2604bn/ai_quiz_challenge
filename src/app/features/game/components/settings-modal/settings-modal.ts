import {
  ChangeDetectionStrategy,
  afterNextRender,
  Component,
  ElementRef,
  computed,
  inject,
  output,
  viewChild,
} from '@angular/core';
import { AudioService } from '../../audio/services/audio.service';
import { keepFocusInside } from '../../../../core/a11y/focus-trap';
import { GameLanguage } from '../../models/game-settings.model';
import { SettingsService } from '../../services/settings.service';

const LANGUAGE_LABELS: Record<GameLanguage, string> = {
  en: 'English',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-settings-modal',
  imports: [],
  templateUrl: './settings-modal.html',
  styleUrl: './settings-modal.scss',
})
export class SettingsModalComponent {
  private readonly settings = inject(SettingsService);
  private readonly audio = inject(AudioService);
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  readonly closed = output<void>();
  readonly soundEnabled = this.settings.soundEnabled;
  readonly animationEnabled = this.settings.animationEnabled;
  readonly volumePercent = computed(() => Math.round(this.settings.volume() * 100));
  readonly languageLabel = computed(() => LANGUAGE_LABELS[this.settings.language()]);

  constructor() {
    afterNextRender(() => {
      this.closeButton()?.nativeElement.focus();
    });
  }

  toggleSound(): void {
    this.audio.playButtonClick();
    this.settings.toggleSound();
  }

  setVolume(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const percent = Number(target.value);
    if (!Number.isFinite(percent)) {
      return;
    }

    this.settings.updateSettings({ volume: percent / 100 });
  }

  toggleAnimation(): void {
    this.settings.toggleAnimation();
  }

  close(): void {
    this.closed.emit();
  }

  trapFocus(event: KeyboardEvent): void {
    keepFocusInside(event);
  }
}
