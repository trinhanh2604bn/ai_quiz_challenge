import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LeaderboardService } from '../../services/leaderboard.service';
import { QuizService } from '../../services/quiz.service';
import { LeaderboardComponent } from '../leaderboard/leaderboard';

@Component({
  selector: 'app-start-screen',
  imports: [LeaderboardComponent],
  templateUrl: './start-screen.html',
  styleUrl: './start-screen.scss',
})
export class StartScreenComponent {
  private readonly quiz = inject(QuizService);
  private readonly leaderboard = inject(LeaderboardService);
  private readonly router = inject(Router);

  readonly totalQuestions = this.quiz.totalQuestions;
  readonly entries = this.leaderboard.entries;

  startQuiz(): void {
    this.quiz.startQuiz();
    void this.router.navigate(['/quiz']);
  }
}
