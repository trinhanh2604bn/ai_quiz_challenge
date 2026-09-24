import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  DIFFICULTY_LEVELS,
  QUESTION_CATEGORIES,
  Difficulty,
  QuestionCategory,
} from '../../models/question.model';
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

  readonly categories = QUESTION_CATEGORIES;
  readonly difficulties = DIFFICULTY_LEVELS;
  readonly entries = this.leaderboard.entries;
  readonly sessionQuestionCount = this.quiz.sessionQuestionCount;
  readonly category = signal<QuestionCategory | null>(null);
  readonly difficulty = signal<Difficulty | null>(null);

  readonly canStart = computed(() => {
    const category = this.category();
    const difficulty = this.difficulty();
    if (category === null || difficulty === null) {
      return false;
    }

    return this.quiz.hasEnoughQuestions(category, difficulty);
  });

  readonly notEnoughQuestions = computed(
    () => this.category() !== null && this.difficulty() !== null && !this.canStart(),
  );

  selectCategory(category: QuestionCategory): void {
    this.category.set(category);
  }

  selectDifficulty(difficulty: Difficulty): void {
    this.difficulty.set(difficulty);
  }

  startQuiz(): void {
    const category = this.category();
    const difficulty = this.difficulty();
    if (category === null || difficulty === null || !this.canStart()) {
      return;
    }

    if (!this.quiz.startQuiz(category, difficulty)) {
      return;
    }

    void this.router.navigate(['/quiz']);
  }
}
