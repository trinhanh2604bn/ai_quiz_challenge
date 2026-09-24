import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AnalyticsService } from '../../services/analytics.service';
import { LeaderboardService } from '../../services/leaderboard.service';
import { QuizService } from '../../services/quiz.service';
import { LeaderboardComponent } from '../leaderboard/leaderboard';
import { PerformanceDashboardComponent } from '../performance-dashboard/performance-dashboard';
import { ProgressBarComponent } from '../progress-bar/progress-bar';

@Component({
  selector: 'app-result-screen',
  imports: [LeaderboardComponent, PerformanceDashboardComponent, ProgressBarComponent, RouterLink],
  templateUrl: './result-screen.html',
  styleUrl: './result-screen.scss',
})
export class ResultScreenComponent implements OnInit {
  private readonly quiz = inject(QuizService);
  private readonly analytics = inject(AnalyticsService);
  private readonly leaderboard = inject(LeaderboardService);
  private readonly router = inject(Router);

  readonly result = this.quiz.result;
  readonly report = this.analytics.report;
  readonly progress = this.quiz.progress;
  readonly entries = this.leaderboard.entries;
  readonly playerName = signal('');
  readonly saved = signal(false);
  readonly canSave = computed(
    () => this.playerName().trim().length > 0 && !this.saved() && this.result() !== null,
  );

  ngOnInit(): void {
    if (!this.quiz.isCompleted()) {
      void this.router.navigate(['/']);
    }
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

    this.leaderboard.addEntry({
      playerName,
      score: quizResult.score,
      accuracy: quizResult.accuracy,
      completedAt: quizResult.completedAt,
    });
    this.saved.set(true);
  }
}
