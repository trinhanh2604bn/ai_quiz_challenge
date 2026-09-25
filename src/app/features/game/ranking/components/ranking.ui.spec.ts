import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from '../../../../app.routes';
import { AudioService } from '../../audio/services/audio.service';
import { GameHomeComponent } from '../../components/game-home/game-home';
import { ProfilePageComponent } from '../../profile/components/profile-page/profile-page';
import { PROFILE_STORAGE_KEY, ProfileService } from '../../profile/services/profile.service';
import { RankingPageComponent } from '../components/ranking-page/ranking-page';
import { RANKING_STORAGE_KEY, SEASON_STORAGE_KEY, RankingService } from '../services/ranking.service';

describe('Ranking UI', () => {
  beforeEach(() => {
    localStorage.removeItem(RANKING_STORAGE_KEY);
    localStorage.removeItem(SEASON_STORAGE_KEY);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
    const audio = TestBed.inject(AudioService);
    spyOn(audio, 'playMenuMusic');
    spyOn(audio, 'playButtonClick');
  });

  afterEach(() => {
    localStorage.removeItem(RANKING_STORAGE_KEY);
    localStorage.removeItem(SEASON_STORAGE_KEY);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    document.documentElement.style.width = '';
    document.body.style.width = '';
    TestBed.resetTestingModule();
  });

  it('shows the active season, then global, season, and category order', () => {
    const rankings = TestBed.inject(RankingService);
    rankings.recordResult({
      sourceId: 'ada',
      player: 'Ada',
      avatarId: 'nova',
      level: 2,
      experience: 120,
      score: 80,
      category: 'Machine Learning',
      mode: 'single-player',
      recordedAt: 2,
    });
    rankings.recordResult({
      sourceId: 'grace',
      player: 'Grace',
      avatarId: '',
      level: 1,
      experience: 0,
      score: 30,
      category: 'Deep Learning',
      mode: 'two-player',
      recordedAt: 3,
    });
    TestBed.inject(ProfileService).createProfile('Ada', 'nova');

    const fixture = TestBed.createComponent(RankingPageComponent);
    fixture.detectChanges();

    let text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('AI Knowledge Season 1');
    expect(text).toContain('Active season');
    expect(names(fixture)).toEqual(['Ada', 'Grace']);
    expect(text).toContain('Silver AI');
    expect(text).toContain('Bronze AI');
    expect(text).toContain('🌟');

    clickButton(fixture, 'Season');
    fixture.detectChanges();
    expect(names(fixture)).toEqual(['Ada', 'Grace']);

    rankings.setActiveSeason({ id: 'season-2', name: 'AI Knowledge Season 2', startedAt: 20 });
    rankings.recordResult({
      sourceId: 'lin',
      player: 'Lin',
      avatarId: 'pixel',
      level: 4,
      experience: 300,
      score: 210,
      category: 'Deep Learning',
      mode: 'single-player',
      recordedAt: 9,
    });
    fixture.detectChanges();
    clickButton(fixture, 'Season');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('AI Knowledge Season 2');
    expect(names(fixture)).toEqual(['Lin']);
    expect(fixture.nativeElement.textContent).toContain('Master AI');

    clickButton(fixture, 'Category');
    fixture.detectChanges();
    clickButton(fixture, 'Deep Learning');
    fixture.detectChanges();
    expect(names(fixture)).toEqual(['Lin', 'Grace']);

    clickButton(fixture, 'Global');
    fixture.detectChanges();
    expect(names(fixture)).toEqual(['Lin', 'Ada', 'Grace']);
    fixture.destroy();
  });

  it('shows an empty board and keeps the profile level beside the rank', () => {
    const rankings = TestBed.inject(RankingService);
    const fixture = TestBed.createComponent(RankingPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No players ranked yet.');
    fixture.destroy();

    const profiles = TestBed.inject(ProfileService);
    profiles.createProfile('Ada', 'atlas');
    const unranked = TestBed.createComponent(ProfilePageComponent);
    unranked.detectChanges();
    expect(unranked.nativeElement.textContent).toContain('Level 1');
    expect(unranked.nativeElement.textContent).toContain('Current rank Unranked');
    expect(unranked.nativeElement.textContent).not.toContain('Bronze AI');
    unranked.destroy();

    rankings.recordResult({
      sourceId: 'ada',
      player: 'Ada',
      avatarId: 'atlas',
      level: profiles.profile()?.level ?? 0,
      experience: profiles.profile()?.experience ?? 0,
      score: 80,
      category: 'Generative AI',
      mode: 'single-player',
      recordedAt: 1,
    });
    const page = TestBed.createComponent(ProfilePageComponent);
    page.detectChanges();
    const text = page.nativeElement.textContent ?? '';
    expect(text).toContain('Level 1');
    expect(text).toContain('Silver AI');
    expect(text).toContain('Current rank #1');
    page.destroy();
  });

  it('opens the ranking page from the lobby', () => {
    TestBed.inject(ProfileService).createProfile('Ada', 'pixel');
    const fixture = TestBed.createComponent(GameHomeComponent);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();

    clickButton(fixture, 'Ranking');
    expect(navigate).toHaveBeenCalledWith(['/ranking']);
    fixture.destroy();
  });

  it('does not overflow horizontally at 390px, 768px, and 1280px', () => {
    const rankings = TestBed.inject(RankingService);
    rankings.recordResult({
      sourceId: 'ada',
      player: 'Ada Lovelace Prompt',
      avatarId: 'nova',
      level: 3,
      experience: 250,
      score: 180,
      category: 'Prompt Engineering',
      mode: 'single-player',
      recordedAt: 1,
    });

    for (const width of [390, 768, 1280]) {
      document.documentElement.style.width = `${width}px`;
      document.body.style.width = `${width}px`;
      const fixture = TestBed.createComponent(RankingPageComponent);
      const host = fixture.nativeElement as HTMLElement;
      host.style.width = '100%';
      fixture.detectChanges();
      const category = clickButton(fixture, 'Category');
      category?.click();
      fixture.detectChanges();

      expect(horizontalOverflow(host)).withContext(`${width}px`).toEqual([]);
      fixture.destroy();
    }
  });
});

function names(fixture: ComponentFixture<RankingPageComponent>): string[] {
  return Array.from(fixture.nativeElement.querySelectorAll('.name'), (node) =>
    (node as HTMLElement).textContent?.trim() ?? '',
  );
}

function clickButton(fixture: ComponentFixture<unknown>, label: string): HTMLButtonElement | undefined {
  const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find((entry) =>
    (entry as HTMLButtonElement).textContent?.includes(label),
  ) as HTMLButtonElement | undefined;
  button?.click();
  return button;
}

function horizontalOverflow(root: HTMLElement): string[] {
  const nodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  return nodes
    .filter((node) => node.scrollWidth > node.clientWidth + 1)
    .map((node) => `${node.tagName}.${node.className}: ${node.scrollWidth}>${node.clientWidth}`);
}
