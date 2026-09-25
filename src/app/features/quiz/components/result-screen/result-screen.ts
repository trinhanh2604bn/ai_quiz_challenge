import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AchievementService } from '../../../game/achievements/services/achievement.service';
import { ProfileService } from '../../../game/profile/services/profile.service';
import { RankingService } from '../../../game/ranking/services/ranking.service';
import { AnalyticsService } from '../../services/analytics.service';
import { LeaderboardService } from '../../services/leaderboard.service';
import { QuizService } from '../../services/quiz.service';
import { LeaderboardComponent } from '../leaderboard/leaderboard';
import { PerformanceDashboardComponent } from '../performance-dashboard/performance-dashboard';
import { ProgressBarComponent } from '../progress-bar/progress-bar';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-result-screen',
  imports: [LeaderboardComponent, PerformanceDashboardComponent, ProgressBarComponent, RouterLink],
  templateUrl: './result-screen.html',
  styleUrl: './result-screen.scss',
})
export class ResultScreenComponent implements OnInit {
  private readonly quiz = inject(QuizService);
  private readonly analytics = inject(AnalyticsService);
  private readonly leaderboard = inject(LeaderboardService);
  private readonly achievements = inject(AchievementService);
  private readonly profiles = inject(ProfileService);
  private readonly rankings = inject(RankingService);
  private readonly router = inject(Router);

  readonly result = this.quiz.result;
  readonly report = this.analytics.report;
  readonly progress = this.quiz.progress;
  readonly entries = this.leaderboard.entries;
  readonly playerName = signal('');
  readonly saved = signal(false);
  readonly mascotSrc = 'game/home/mascot-celebrate.png';
  readonly trophySrc = 'game/home/icon-achievements.png';
  readonly perfect = computed(() => {
    const quizResult = this.result();
    return (
      quizResult !== null &&
      quizResult.totalQuestions > 0 &&
      quizResult.correctCount === quizResult.totalQuestions
    );
  });
  readonly canSave = computed(
    () => this.playerName().trim().length > 0 && !this.saved() && this.result() !== null,
  );

  ngOnInit(): void {
    if (!this.quiz.isCompleted()) {
      void this.router.navigate(['/']);
      return;
    }

    const nickname = this.profiles.profile()?.nickname ?? '';
    if (nickname.length > 0 && this.playerName().trim().length === 0) {
      this.playerName.set(nickname);
    }

    this.recordAchievements();
    this.recordRanking();
  }

  updateName(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.playerName.set(target.value);
  }

  saveScore(event: Event): void {
    event.preventDefault();
    const quizResult = this.result();
    const playerName = this.playerName().trim();
    if (!quizResult || playerName.length === 0 || this.saved()) {
      return;
    }

    const identity = this.profiles.profile();
    this.leaderboard.addEntry({
      playerName,
      score: quizResult.score,
      accuracy: quizResult.accuracy,
      completedAt: quizResult.completedAt,
      ...(identity
        ? { avatarId: identity.avatarId, level: identity.level }
        : {}),
    });
    this.saved.set(true);
  }

  private recordAchievements(): void {
    const result = this.result();
    const category = this.quiz.category();
    const difficulty = this.quiz.difficulty();
    if (!result || !category || !difficulty) {
      return;
    }

    const unlocked = this.achievements.recordQuizCompletion({
      completedAt: result.completedAt,
      score: result.score,
      accuracy: result.accuracy,
      maxStreak: result.maxStreak,
      category,
      difficulty,
      totalQuestions: result.totalQuestions,
      correctCount: result.correctCount,
    });
    this.profiles.recordQuizCompletion({
      completedAt: result.completedAt,
      category,
      score: result.score,
      maxStreak: result.maxStreak,
      totalQuestions: result.totalQuestions,
      correctCount: result.correctCount,
    });
    this.profiles.recordAchievementUnlocks(unlocked.map((item) => item.id));
  }

  private recordRanking(): void {
    const result = this.result();
    const category = this.quiz.category();
    const profile = this.profiles.profile();
    if (!result || !category || !profile) {
      return;
    }

    this.rankings.recordResult({
      sourceId: `solo:${result.completedAt}`,
      player: profile.nickname,
      avatarId: profile.avatarId,
      level: profile.level,
      experience: profile.experience,
      score: result.score,
      category,
      mode: 'single-player',
      recordedAt: result.completedAt,
    });
  }
}
