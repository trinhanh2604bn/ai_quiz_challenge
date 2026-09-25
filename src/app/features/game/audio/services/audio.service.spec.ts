import { TestBed } from '@angular/core/testing';
import { SettingsModalComponent } from '../../components/settings-modal/settings-modal';
import { SETTINGS_STORAGE_KEY, SettingsService } from '../../services/settings.service';
import { AUDIO_LIBRARY } from '../data/audio-library.data';
import { SOUND_CUE_IDS, SoundCueId } from '../models/sound-cue.model';
import { AudioService } from './audio.service';

describe('AudioService', () => {
  beforeEach(() => {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    TestBed.resetTestingModule();
  });

  it('maps menu, quiz, battle, UI, answer, timeout, achievement, and victory cues', () => {
    expect(AUDIO_LIBRARY.menu).toEqual(jasmine.objectContaining({ group: 'music', loop: true }));
    expect(AUDIO_LIBRARY.quiz.group).toBe('music');
    expect(AUDIO_LIBRARY.battle.group).toBe('music');
    expect(AUDIO_LIBRARY.button.group).toBe('ui');
    expect(AUDIO_LIBRARY.selection.group).toBe('ui');
    expect(AUDIO_LIBRARY.correct.group).toBe('effect');
    expect(AUDIO_LIBRARY.wrong.group).toBe('effect');
    expect(AUDIO_LIBRARY.timeout.group).toBe('effect');
    expect(AUDIO_LIBRARY.achievement.group).toBe('effect');
    expect(AUDIO_LIBRARY.turn.group).toBe('battle');
    expect(AUDIO_LIBRARY.victory.group).toBe('battle');

    for (const id of SOUND_CUE_IDS) {
      expect(AUDIO_LIBRARY[id].id).toBe(id);
      expect(AUDIO_LIBRARY[id].steps.length).toBeGreaterThan(0);
    }
  });

  it('holds music until a user gesture unlocks audio', () => {
    const audio = TestBed.inject(AudioService);
    TestBed.flushEffects();

    audio.playMenuMusic();

    expect(audio.unlocked()).toBeFalse();
    expect(audio.activeMusic()).toBeNull();

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));

    expect(audio.unlocked()).toBeTrue();
    expect(audio.activeMusic()).toBe('menu');
    expect(audio.playbackState()).not.toBe('unavailable');
  });

  it('plays answer, timeout, and achievement cues while sound is on', () => {
    const audio = TestBed.inject(AudioService);
    TestBed.flushEffects();
    audio.unlock();

    const cues: ReadonlyArray<readonly [() => void, SoundCueId]> = [
      [() => audio.playCorrectSound(), 'correct'],
      [() => audio.playWrongSound(), 'wrong'],
      [() => audio.playTimeoutSound(), 'timeout'],
      [() => audio.playAchievementSound(), 'achievement'],
    ];

    for (const [play, id] of cues) {
      play();
      expect(audio.lastCue()).toBe(id);
    }

    expect(audio.playbackState() === 'running' || audio.playbackState() === 'suspended').toBeTrue();
    expect(audio.activeVoiceCount()).toBeGreaterThan(0);
  });

  it('stops music and ignores new cues when sound is off', () => {
    const settings = TestBed.inject(SettingsService);
    const audio = TestBed.inject(AudioService);
    TestBed.flushEffects();
    audio.unlock();
    audio.playQuizMusic();
    audio.playCorrectSound();

    expect(audio.activeMusic()).toBe('quiz');
    expect(audio.lastCue()).toBe('correct');

    settings.updateSettings({ soundEnabled: false });
    TestBed.flushEffects();

    expect(audio.activeMusic()).toBeNull();
    expect(audio.masterVolume()).toBe(0);
    expect(audio.activeVoiceCount()).toBe(0);

    audio.playWrongSound();
    audio.playTimeoutSound();
    audio.playAchievementSound();
    audio.playMenuMusic();

    expect(audio.lastCue()).toBe('correct');
    expect(audio.activeMusic()).toBeNull();
  });

  it('follows the settings volume and resumes music when sound is enabled again', () => {
    const settings = TestBed.inject(SettingsService);
    const audio = TestBed.inject(AudioService);
    TestBed.flushEffects();
    audio.unlock();
    audio.playBattleMusic();
    settings.updateSettings({ volume: 0.4 });
    TestBed.flushEffects();

    expect(audio.masterVolume()).toBe(0.4);
    expect(audio.activeMusic()).toBe('battle');

    settings.toggleSound();
    TestBed.flushEffects();
    expect(audio.activeMusic()).toBeNull();

    settings.toggleSound();
    TestBed.flushEffects();

    expect(settings.soundEnabled()).toBeTrue();
    expect(audio.masterVolume()).toBe(0.4);
    expect(audio.activeMusic()).toBe('battle');
    audio.stopScene('quiz');
    expect(audio.activeMusic()).toBe('battle');
    audio.stopScene('battle');
    expect(audio.activeMusic()).toBeNull();
  });

  it('persists sound and volume, including settings saved before volume existed', () => {
    const settings = TestBed.inject(SettingsService);
    settings.updateSettings({ soundEnabled: false, volume: 0.35, animationEnabled: false });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(SettingsService);

    expect(reloaded.soundEnabled()).toBeFalse();
    expect(reloaded.volume()).toBe(0.35);
    expect(reloaded.animationEnabled()).toBeFalse();
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toEqual(
      jasmine.objectContaining({ soundEnabled: false, volume: 0.35 }),
    );

    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ soundEnabled: true, animationEnabled: true, language: 'en' }),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const legacy = TestBed.inject(SettingsService);
    expect(legacy.soundEnabled()).toBeTrue();
    expect(legacy.volume()).toBe(1);

    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ soundEnabled: true, animationEnabled: true, language: 'en', volume: 9 }),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(TestBed.inject(SettingsService).volume()).toBe(1);
  });

  it('saves the settings slider and turns audio off from the sound switch', () => {
    const fixture = TestBed.createComponent(SettingsModalComponent);
    const audio = TestBed.inject(AudioService);
    const settings = TestBed.inject(SettingsService);
    fixture.detectChanges();
    TestBed.flushEffects();
    audio.unlock();
    audio.playMenuMusic();
    audio.playCorrectSound();

    const slider = fixture.nativeElement.querySelector('#settings-volume') as HTMLInputElement;
    expect(slider.value).toBe('100');
    slider.value = '40';
    slider.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(settings.volume()).toBe(0.4);
    expect(audio.masterVolume()).toBe(0.4);
    expect(fixture.nativeElement.textContent).toContain('40%');
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}').volume).toBe(0.4);

    const soundSwitch = fixture.nativeElement.querySelector('[aria-label="Sound on"]') as HTMLButtonElement;
    soundSwitch.click();
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(settings.soundEnabled()).toBeFalse();
    expect(audio.activeMusic()).toBeNull();
    expect(audio.masterVolume()).toBe(0);
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}').soundEnabled).toBeFalse();

    audio.playWrongSound();
    audio.playTimeoutSound();
    audio.playAchievementSound();
    expect(audio.lastCue()).not.toBe('wrong');
    expect(audio.lastCue()).not.toBe('timeout');
    expect(audio.lastCue()).not.toBe('achievement');
    fixture.destroy();
  });
});
