import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../../../app.routes';
import { ResultScreenComponent } from '../../../quiz/components/result-screen/result-screen';
import { QuizService } from '../../../quiz/services/quiz.service';
import { LeaderboardService } from '../../../quiz/services/leaderboard.service';
import { ACHIEVEMENT_STORAGE_KEY } from '../../achievements/services/achievement.service';
import { BattleResultComponent } from '../../components/battle-result/battle-result';
import { BattlePlayer } from '../../models/battle-player.model';
import { BattleService } from '../../services/battle.service';
import { Question } from '../../../quiz/models/question.model';
import { levelForExperience } from '../../profile/data/progression.data';
import { PROFILE_STORAGE_KEY, ProfileService } from '../../profile/services/profile.service';
import { RankingRecord } from '../models/ranking-entry.model';
import {
  RANKING_STORAGE_KEY,
  SEASON_STORAGE_KEY,
  RankingService,
} from './ranking.service';

describe('RankingService', () => {
  beforeEach(() => {
    clearRankingStorage();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
  });

  afterEach(() => {
    clearRankingStorage();
    TestBed.resetTestingModule();
  });

  it('loads AI Knowledge Season 1 and stores it', () => {
    const season = TestBed.inject(RankingService).activeSeason();

    expect(season.id).toBe('season-1');
    expect(season.name).toBe('AI Knowledge Season 1');
    expect(localStorage.getItem(SEASON_STORAGE_KEY)).toContain('AI Knowledge Season 1');
  });

  it('reloads the active season from localStorage', () => {
    const service = TestBed.inject(RankingService);
    expect(
      service.setActiveSeason({
        id: 'season-2',
        name: 'AI Knowledge Season 2',
        startedAt: Date.UTC(2026, 5, 1),
      })?.name,
    ).toBe('AI Knowledge Season 2');
    expect(service.setActiveSeason({ id: ' ', name: 'Blank', startedAt: 1 })).toBeNull();
    expect(service.activeSeason().id).toBe('season-2');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });

    expect(TestBed.inject(RankingService).activeSeason()).toEqual({
      id: 'season-2',
      name: 'AI Knowledge Season 2',
      startedAt: Date.UTC(2026, 5, 1),
    });
  });

  it('treats invalid season and ranking JSON as the default season and an empty board', () => {
    localStorage.setItem(SEASON_STORAGE_KEY, '{');
    localStorage.setItem(RANKING_STORAGE_KEY, '{');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });

    const service = TestBed.inject(RankingService);
    expect(service.activeSeason().name).toBe('AI Knowledge Season 1');
    expect(service.entries()).toEqual([]);
    expect(localStorage.getItem(SEASON_STORAGE_KEY)).toContain('AI Knowledge Season 1');
  });

  it('orders a player once by best score, then XP, level, and later time', () => {
    const service = TestBed.inject(RankingService);
    record(service, { sourceId: 'mei', player: 'Mei', score: 90, experience: 0, recordedAt: 1 });
    record(service, { sourceId: 'lin', player: 'Lin', score: 40, experience: 30, recordedAt: 1 });
    record(service, {
      sourceId: 'ada-low',
      player: 'Ada',
      score: 20,
      experience: 10,
      level: 2,
      recordedAt: 1,
    });
    record(service, {
      sourceId: 'ada-best',
      player: 'Ada',
      score: 40,
      experience: 10,
      level: 2,
      recordedAt: 1,
    });
    record(service, { sourceId: 'nova', player: 'Nova', score: 40, experience: 10, recordedAt: 8 });
    record(service, { sourceId: 'grace', player: 'Grace', score: 40, experience: 10, recordedAt: 1 });

    expect(service.getGlobalRanking().map((row) => row.player)).toEqual([
      'Mei',
      'Lin',
      'Ada',
      'Nova',
      'Grace',
    ]);
    expect(service.getGlobalRanking().find((row) => row.player === 'Ada')?.score).toBe(40);
    expect(service.entries().length).toBe(6);
    expect(service.calculateRank('Lin')).toBe(2);
    expect(service.calculateRank('Missing')).toBeNull();
  });

  it('maps score boundaries onto the five AI tiers', () => {
    const service = TestBed.inject(RankingService);

    expect(service.getTier(0)).toBe('Bronze AI');
    expect(service.getTier(49)).toBe('Bronze AI');
    expect(service.getTier(50)).toBe('Silver AI');
    expect(service.getTier(99)).toBe('Silver AI');
    expect(service.getTier(100)).toBe('Gold AI');
    expect(service.getTier(149)).toBe('Gold AI');
    expect(service.getTier(150)).toBe('Platinum AI');
    expect(service.getTier(199)).toBe('Platinum AI');
    expect(service.getTier(200)).toBe('Master AI');
    expect(service.getTier(240)).toBe('Master AI');
    expect(service.getTier(Number.NaN)).toBeNull();
    expect(service.getTier()).toBeNull();

    TestBed.inject(ProfileService).createProfile('Ada', 'nova');
    record(service, { sourceId: 'ada', player: 'Ada', score: 100, avatarId: 'nova' });

    expect(service.getTier()).toBe('Gold AI');
    expect(service.calculateRank()).toBe(1);
  });

  it('filters category and season boards without mixing the other rows', () => {
    const service = TestBed.inject(RankingService);
    record(service, {
      sourceId: 'ada-ml',
      player: 'Ada',
      score: 80,
      category: 'Machine Learning',
    });
    record(service, {
      sourceId: 'ada-dl',
      player: 'Ada',
      score: 15,
      category: 'Deep Learning',
    });
    service.setActiveSeason({ id: 'season-2', name: 'AI Knowledge Season 2', startedAt: 10 });
    record(service, {
      sourceId: 'grace-dl',
      player: 'Grace',
      score: 40,
      category: 'Deep Learning',
    });
    record(service, {
      sourceId: 'ada-s2',
      player: 'Ada',
      score: 20,
      category: 'Machine Learning',
    });

    expect(service.getCategoryRanking('Deep Learning').map((row) => [row.player, row.score])).toEqual([
      ['Grace', 40],
      ['Ada', 15],
    ]);
    expect(service.getCategoryRanking('Machine Learning').map((row) => row.score)).toEqual([80]);
    expect(service.getSeasonRanking().map((row) => [row.player, row.score])).toEqual([
      ['Grace', 40],
      ['Ada', 20],
    ]);
    expect(service.getSeasonRanking('season-1').map((row) => [row.player, row.score])).toEqual([
      ['Ada', 80],
    ]);
    expect(service.getGlobalRanking().map((row) => [row.player, row.score])).toEqual([
      ['Ada', 80],
      ['Grace', 40],
    ]);
  });

  it('reloads ranking entries from localStorage', () => {
    record(TestBed.inject(RankingService), {
      sourceId: 'ada',
      player: 'Ada',
      score: 55,
      category: 'Prompt Engineering',
      mode: 'two-player',
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const reloaded = TestBed.inject(RankingService).getGlobalRanking();

    expect(reloaded.map((row) => row.player)).toEqual(['Ada']);
    expect(reloaded[0]?.score).toBe(55);
    expect(reloaded[0]?.category).toBe('Prompt Engineering');
    expect(reloaded[0]?.mode).toBe('two-player');
    expect(reloaded[0]?.tier).toBe('Silver AI');
    expect(reloaded[0]?.seasonId).toBe('season-1');
  });

  it('ignores a repeated source, a blank player, and invalid stored rows', () => {
    const service = TestBed.inject(RankingService);
    expect(record(service, { sourceId: 'ada', player: 'Ada', score: 10 })).not.toBeNull();
    expect(record(service, { sourceId: 'ada', player: 'Ada', score: 90 })).toBeNull();
    expect(record(service, { sourceId: 'blank', player: '   ', score: 90 })).toBeNull();
    expect(service.getGlobalRanking().map((row) => row.score)).toEqual([10]);

    localStorage.setItem(
      RANKING_STORAGE_KEY,
      JSON.stringify([
        { player: 'Skip' },
        {
          sourceId: 'grace',
          player: 'Grace',
          avatarId: 'missing',
          level: 2,
          experience: 40,
          score: 70,
          category: 'Generative AI',
          mode: 'single-player',
          seasonId: 'season-1',
          recordedAt: 4,
        },
        {
          sourceId: 'grace',
          player: 'Grace',
          avatarId: 'nova',
          level: 9,
          experience: 1,
          score: 1,
          category: 'Generative AI',
          mode: 'single-player',
          seasonId: 'season-1',
          recordedAt: 5,
        },
      ]),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const rows = TestBed.inject(RankingService).entries();

    expect(rows.length).toBe(1);
    expect(rows[0]?.player).toBe('Grace');
    expect(rows[0]?.avatarId).toBe('');
    expect(rows[0]?.score).toBe(70);
  });

  it('stores a profile snapshot without changing level or experience', () => {
    const profiles = TestBed.inject(ProfileService);
    profiles.createProfile('Ada', 'spark');
    const before = profiles.profile();
    const service = TestBed.inject(RankingService);

    const stored = service.recordResult({
      sourceId: 'solo:1',
      player: 'Ada',
      avatarId: 'spark',
      level: before?.level ?? 0,
      experience: before?.experience ?? 0,
      score: 80,
      category: 'AI Fundamentals',
      mode: 'single-player',
      recordedAt: 1,
    });

    expect(stored?.level).toBe(1);
    expect(stored?.experience).toBe(0);
    expect(profiles.profile()).toEqual(before);
    expect(TestBed.inject(LeaderboardService).entries()).toEqual([]);
  });

  it('records a finished solo quiz without changing its score', async () => {
    const profiles = TestBed.inject(ProfileService);
    profiles.createProfile('Ada', 'nova');
    const quiz = TestBed.inject(QuizService);
    expect(quiz.startQuiz('Machine Learning', 'Easy')).toBeTrue();
    for (let index = 0; index < 10; index += 1) {
      const question = quiz.currentQuestion();
      expect(question).not.toBeNull();
      if (!question) {
        return;
      }

      quiz.selectAnswer(question.correctIndex);
      quiz.nextQuestion();
      await Promise.resolve();
    }

    const score = quiz.score();
    const fixture = TestBed.createComponent(ResultScreenComponent);
    fixture.detectChanges();

    const ranking = TestBed.inject(RankingService).getGlobalRanking();
    expect(quiz.score()).toBe(score);
    expect(ranking.map((row) => row.score)).toEqual([score]);
    expect(ranking[0]?.player).toBe('Ada');
    expect(ranking[0]?.category).toBe('Machine Learning');
    expect(ranking[0]?.mode).toBe('single-player');
    expect(TestBed.inject(LeaderboardService).entries()).toEqual([]);
    fixture.destroy();

    const again = TestBed.createComponent(ResultScreenComponent);
    again.detectChanges();
    expect(TestBed.inject(RankingService).entries().length).toBe(1);
    expect(quiz.score()).toBe(score);
    again.destroy();
  });

  it('records both battle players without changing battle scores or leaderboard order', () => {
    const battle = TestBed.inject(BattleService);
    battle.createBattle(
      [player('player-1', 'Local', 40), player('player-2', 'Grace', 40)],
      [sampleQuestion()],
    );
    battle.startBattle();
    battle.completeBattle('player-1');
    const scores = battle.session()?.players.map((entry) => entry.score);

    const fixture = TestBed.createComponent(BattleResultComponent);
    fixture.detectChanges();

    expect(battle.session()?.players.map((entry) => entry.score)).toEqual(scores);
    expect(TestBed.inject(LeaderboardService).entries().map((entry) => entry.playerName)).toEqual([
      'Local',
      'Grace',
    ]);
    expect(TestBed.inject(RankingService).getGlobalRanking().map((row) => row.player)).toEqual([
      'Grace',
      'Local',
    ]);
    expect(TestBed.inject(RankingService).getCategoryRanking('AI Fundamentals').length).toBe(2);
    fixture.destroy();

    const again = TestBed.createComponent(BattleResultComponent);
    again.detectChanges();
    expect(TestBed.inject(RankingService).entries().length).toBe(2);
    expect(battle.session()?.players.map((entry) => entry.score)).toEqual(scores);
    again.destroy();
  });

  it('copies the local battle profile after progression without a new level formula', () => {
    const profiles = TestBed.inject(ProfileService);
    profiles.createProfile('Ada', 'atlas');
    const battle = TestBed.inject(BattleService);
    battle.createBattle(
      [player('player-1', 'Local', 50), player('player-2', 'Grace', 10)],
      [sampleQuestion()],
    );
    battle.startBattle();
    battle.completeBattle('player-1');
    const scores = battle.session()?.players.map((entry) => entry.score);

    const fixture = TestBed.createComponent(BattleResultComponent);
    fixture.detectChanges();

    const profile = profiles.profile();
    const standing = TestBed.inject(RankingService)
      .getGlobalRanking()
      .find((row) => row.player === 'Ada');
    expect(battle.session()?.players.map((entry) => entry.score)).toEqual(scores);
    expect(standing?.score).toBe(50);
    expect(standing?.avatarId).toBe('atlas');
    expect(standing?.level).toBe(profile?.level);
    expect(standing?.experience).toBe(profile?.experience);
    expect(profile?.level).toBe(levelForExperience(profile?.experience ?? 0));
    expect(standing?.mode).toBe('two-player');
    fixture.destroy();
  });
});

function clearRankingStorage(): void {
  localStorage.removeItem(RANKING_STORAGE_KEY);
  localStorage.removeItem(SEASON_STORAGE_KEY);
  localStorage.removeItem(PROFILE_STORAGE_KEY);
  localStorage.removeItem(ACHIEVEMENT_STORAGE_KEY);
  localStorage.removeItem('ai-quiz-leaderboard');
}

function record(
  service: RankingService,
  overrides: Partial<RankingRecord> & Pick<RankingRecord, 'sourceId' | 'player' | 'score'>,
) {
  return service.recordResult({
    avatarId: 'nova',
    level: 1,
    experience: 0,
    category: 'AI Fundamentals',
    mode: 'single-player',
    recordedAt: 1,
    ...overrides,
  });
}

function player(id: string, name: string, score: number): BattlePlayer {
  return {
    id,
    name,
    score,
    correctAnswers: 0,
    streak: 0,
    bestStreak: 0,
    answers: [],
  };
}

function sampleQuestion(): Question {
  return {
    id: 'q-1',
    text: 'Prompt',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    category: 'AI Fundamentals',
    difficulty: 'Easy',
  };
}
