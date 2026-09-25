import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from '../../../../app.routes';
import { LeaderboardComponent } from '../../../quiz/components/leaderboard/leaderboard';
import { AudioService } from '../../audio/services/audio.service';
import { GameHomeComponent } from '../../components/game-home/game-home';
import { ProfileCreateComponent } from '../components/profile-create/profile-create';
import { ProfilePageComponent } from '../components/profile-page/profile-page';
import { XpBarComponent } from '../components/xp-bar/xp-bar';
import { PROFILE_STORAGE_KEY, ProfileService } from '../services/profile.service';

describe('Profile UI', () => {
  beforeEach(() => {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
    const audio = TestBed.inject(AudioService);
    spyOn(audio, 'playMenuMusic');
    spyOn(audio, 'playSelection');
    spyOn(audio, 'playButtonClick');
  });

  afterEach(() => {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    TestBed.resetTestingModule();
  });

  it('creates a profile from a nickname and avatar', () => {
    const fixture = TestBed.createComponent(ProfileCreateComponent);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();

    const submit = gameButton(fixture);
    expect(submit.disabled).toBeTrue();

    setNickname(fixture, 'Ada');
    expect(gameButton(fixture).disabled).toBeTrue();

    clickAvatar(fixture, 'Nova');
    expect(gameButton(fixture).disabled).toBeFalse();
    gameButton(fixture).click();
    fixture.detectChanges();

    const profile = TestBed.inject(ProfileService).profile();
    expect(profile?.nickname).toBe('Ada');
    expect(profile?.avatarId).toBe('nova');
    expect(navigate).toHaveBeenCalledWith(['/']);
    fixture.destroy();
  });

  it('shows level progress and session statistics', () => {
    const profiles = TestBed.inject(ProfileService);
    profiles.createProfile('Ada', 'atlas');
    profiles.recordQuizCompletion({
      completedAt: 5,
      category: 'Generative AI',
      score: 200,
      maxStreak: 10,
      totalQuestions: 10,
      correctCount: 10,
    });

    const bar = TestBed.createComponent(XpBarComponent);
    bar.componentRef.setInput('experience', 250);
    bar.detectChanges();
    const progress = bar.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    expect(progress.getAttribute('aria-valuenow')).toBe('50');
    expect(progress.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.nativeElement.textContent).toContain('50 / 100 XP');
    bar.destroy();

    const page = TestBed.createComponent(ProfilePageComponent);
    page.detectChanges();
    const text = page.nativeElement.textContent ?? '';
    expect(text).toContain('Ada');
    expect(text).toContain('Level 3');
    expect(text).toContain('250 XP total');
    expect(text).toContain('Solo games');
    expect(text).toContain('Generative AI');
    expect(text).toContain('100%');
    expect(text).toContain('200');
    page.destroy();
  });

  it('shows avatar and level on the leaderboard in the stored order', () => {
    const fixture = TestBed.createComponent(LeaderboardComponent);
    fixture.componentRef.setInput('entries', [
      {
        playerName: 'Low',
        score: 10,
        accuracy: 20,
        completedAt: Date.UTC(2026, 0, 2, 15, 4),
        avatarId: 'nova',
        level: 4,
      },
      {
        playerName: 'High',
        score: 90,
        accuracy: 90,
        completedAt: Date.UTC(2026, 0, 2, 15, 5),
        level: 1,
      },
    ]);
    fixture.detectChanges();

    const names = Array.from(fixture.nativeElement.querySelectorAll('.name'), (node) =>
      (node as HTMLElement).textContent?.trim(),
    );
    const text = fixture.nativeElement.textContent ?? '';
    expect(names).toEqual(['Low', 'High']);
    expect(text).toContain('🌟');
    expect(text).toContain('Lv 4');
    expect(text).toContain('Lv 1');
    fixture.destroy();
  });

  it('opens the profile page from the lobby', () => {
    TestBed.inject(ProfileService).createProfile('Ada', 'pixel');
    const fixture = TestBed.createComponent(GameHomeComponent);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ada');
    expect(fixture.nativeElement.textContent).toContain('Level 1');
    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find((entry) =>
      (entry as HTMLButtonElement).textContent?.includes('Profile'),
    ) as HTMLButtonElement | undefined;
    button?.click();

    expect(navigate).toHaveBeenCalledWith(['/profile']);
    fixture.destroy();
  });
});

function gameButton(fixture: ComponentFixture<ProfileCreateComponent>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('button.game-button') as HTMLButtonElement;
}

function setNickname(fixture: ComponentFixture<ProfileCreateComponent>, value: string): void {
  const input = fixture.nativeElement.querySelector('#profile-nickname') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function clickAvatar(fixture: ComponentFixture<ProfileCreateComponent>, label: string): void {
  const button = Array.from(fixture.nativeElement.querySelectorAll('button.avatar')).find((entry) =>
    (entry as HTMLButtonElement).textContent?.includes(label),
  ) as HTMLButtonElement | undefined;
  button?.click();
  fixture.detectChanges();
}
