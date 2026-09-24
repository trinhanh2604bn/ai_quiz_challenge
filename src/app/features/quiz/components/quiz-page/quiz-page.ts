import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AudioService } from '../../services/audio.service';
import { QuizService } from '../../services/quiz.service';
import { ProgressBarComponent } from '../progress-bar/progress-bar';
import { QuestionCardComponent } from '../question-card/question-card';
import { ScoreBoardComponent } from '../score-board/score-board';
import { TimerComponent } from '../timer/timer';

const FEEDBACK_DELAY_MS = 800;

@Component({
  selector: 'app-quiz-page',
  imports: [
    ProgressBarComponent,
    QuestionCardComponent,
    ScoreBoardComponent,
    TimerComponent,
    RouterLink,
  ],
  templateUrl: './quiz-page.html',
  styleUrl: './quiz-page.scss',
})
export class QuizPageComponent implements OnInit {
  private readonly quiz = inject(QuizService);
  private readonly audio = inject(AudioService);
  private readonly router = inject(Router);
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private feedbackPending = false;

  readonly selectedOption = signal<number | null>(null);
  readonly totalQuestions = this.quiz.totalQuestions;
  readonly score = this.quiz.score;
  readonly correctCount = this.quiz.correctCount;
  readonly streak = this.quiz.streak;
  readonly multiplier = this.quiz.multiplier;
  readonly progress = this.quiz.progress;
  readonly category = this.quiz.category;
  readonly difficulty = this.quiz.difficulty;
  readonly questionNumber = computed(() => this.quiz.index() + 1);
  readonly showEmptySelection = computed(
    () => this.quiz.isInProgress() && this.quiz.currentQuestion() === null,
  );
  readonly visibleQuestions = computed(() => {
    if (this.quiz.isCompleted()) {
      return [];
    }

    const question = this.quiz.currentQuestion();
    return question ? [question] : [];
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearFeedbackTimer());

    effect(() => {
      const questionId = this.quiz.currentQuestion()?.id ?? null;
      if (!this.quiz.isInProgress() || questionId === null) {
        return;
      }

      untracked(() => this.quiz.markQuestionDisplayed(questionId));
    });
  }

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
    if (this.feedbackPending) {
      return;
    }

    const question = this.quiz.currentQuestion();
    const answeredBefore = this.quiz.answeredCount();
    this.quiz.selectAnswer(optionIndex);
    if (!question || this.quiz.answeredCount() !== answeredBefore + 1) {
      return;
    }

    this.feedbackPending = true;
    this.selectedOption.set(optionIndex);
    if (optionIndex === question.correctIndex) {
      this.audio.playCorrectSound();
    } else {
      this.audio.playWrongSound();
    }

    this.feedbackTimer = setTimeout(() => this.finishFeedback(), FEEDBACK_DELAY_MS);
  }

  onTimeout(questionId: string): void {
    if (this.feedbackPending || !this.quiz.isInProgress()) {
      return;
    }

    const current = this.quiz.currentQuestion();
    if (!current || current.id !== questionId) {
      return;
    }

    this.quiz.skipQuestion();
    this.openResultIfCompleted();
  }

  private finishFeedback(): void {
    if (!this.feedbackPending) {
      return;
    }

    this.feedbackPending = false;
    this.feedbackTimer = null;
    this.quiz.nextQuestion();
    this.selectedOption.set(null);
    this.openResultIfCompleted();
  }

  private clearFeedbackTimer(): void {
    if (this.feedbackTimer !== null) {
      clearTimeout(this.feedbackTimer);
      this.feedbackTimer = null;
    }
  }

  private openResultIfCompleted(): void {
    if (this.quiz.isCompleted()) {
      this.audio.playCompleteSound();
      void this.router.navigate(['/result']);
    }
  }
}
