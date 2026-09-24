import { Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AudioService } from '../../services/audio.service';
import { QuizService } from '../../services/quiz.service';
import { ProgressBarComponent } from '../progress-bar/progress-bar';
import { QuestionCardComponent } from '../question-card/question-card';
import { ScoreBoardComponent } from '../score-board/score-board';
import { TimerComponent } from '../timer/timer';

@Component({
  selector: 'app-quiz-page',
  imports: [ProgressBarComponent, QuestionCardComponent, ScoreBoardComponent, TimerComponent],
  templateUrl: './quiz-page.html',
  styleUrl: './quiz-page.scss',
})
export class QuizPageComponent implements OnInit {
  private readonly quiz = inject(QuizService);
  private readonly audio = inject(AudioService);
  private readonly router = inject(Router);

  readonly totalQuestions = this.quiz.totalQuestions;
  readonly score = this.quiz.score;
  readonly correctCount = this.quiz.correctCount;
  readonly streak = this.quiz.streak;
  readonly multiplier = this.quiz.multiplier;
  readonly progress = this.quiz.progress;
  readonly questionNumber = computed(() => this.quiz.index() + 1);
  readonly visibleQuestions = computed(() => {
    if (this.quiz.isCompleted()) {
      return [];
    }

    const question = this.quiz.currentQuestion();
    return question ? [question] : [];
  });

  ngOnInit(): void {
    if (this.quiz.isCompleted()) {
      void this.router.navigate(['/result']);
      return;
    }

    if (!this.quiz.isInProgress()) {
      void this.router.navigate(['/']);
    }
  }

  onAnswerSelected(optionIndex: number): void {
    const question = this.quiz.currentQuestion();
    const answeredBefore = this.quiz.answeredCount();
    this.quiz.selectAnswer(optionIndex);
    if (question && this.quiz.answeredCount() === answeredBefore + 1) {
      if (optionIndex === question.correctIndex) {
        this.audio.playCorrectSound();
      } else {
        this.audio.playWrongSound();
      }
    }
    this.quiz.nextQuestion();
    this.openResultIfCompleted();
  }

  onTimeout(questionId: string): void {
    if (!this.quiz.isInProgress()) {
      return;
    }

    const current = this.quiz.currentQuestion();
    if (!current || current.id !== questionId) {
      return;
    }

    this.quiz.skipQuestion();
    this.openResultIfCompleted();
  }

  private openResultIfCompleted(): void {
    if (this.quiz.isCompleted()) {
      this.audio.playCompleteSound();
      void this.router.navigate(['/result']);
    }
  }
}
