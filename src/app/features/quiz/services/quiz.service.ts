import { Injectable, computed, signal } from '@angular/core';
import { QUESTIONS } from '../data/questions.data';
import { Question } from '../models/question.model';
import { QuizResult } from '../models/quiz-result.model';
import { QuizStatus } from '../models/quiz-state.model';

const POINTS_PER_CORRECT_ANSWER = 10;

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private readonly questions = signal<readonly Question[]>(QUESTIONS);
  private readonly status = signal<QuizStatus>('idle');
  private readonly currentIndex = signal(0);
  private readonly selectedAnswers = signal<readonly (number | null)[]>([]);
  private readonly scoreState = signal(0);
  private readonly correctCountState = signal(0);
  private readonly streakState = signal(0);
  private readonly maxStreakState = signal(0);
  private readonly resultState = signal<QuizResult | null>(null);
  private transitionLocked = false;

  readonly quizStatus = this.status.asReadonly();
  readonly index = this.currentIndex.asReadonly();
  readonly totalQuestions = computed(() => this.questions().length);
  readonly currentQuestion = computed(() => this.questions()[this.currentIndex()] ?? null);
  readonly isInProgress = computed(() => this.status() === 'in-progress');
  readonly isCompleted = computed(() => this.status() === 'completed');
  readonly answeredCount = computed(() => this.selectedAnswers().length);
  readonly score = this.scoreState.asReadonly();
  readonly correctCount = this.correctCountState.asReadonly();
  readonly streak = this.streakState.asReadonly();
  readonly maxStreak = this.maxStreakState.asReadonly();
  readonly multiplier = computed(() => this.multiplierFor(this.streakState()));
  readonly progress = computed(() => this.calculateProgress());
  readonly result = this.resultState.asReadonly();

  startQuiz(): void {
    this.questions.set(QUESTIONS);
    this.currentIndex.set(0);
    this.selectedAnswers.set([]);
    this.scoreState.set(0);
    this.correctCountState.set(0);
    this.streakState.set(0);
    this.maxStreakState.set(0);
    this.resultState.set(null);
    this.transitionLocked = false;
    this.status.set('in-progress');
  }

  selectAnswer(optionIndex: number): void {
    if (
      this.transitionLocked ||
      this.status() !== 'in-progress' ||
      !this.isOptionIndex(optionIndex)
    ) {
      return;
    }

    if (this.selectedAnswers().length !== this.currentIndex()) {
      return;
    }

    const question = this.questions()[this.currentIndex()];
    if (!question) {
      return;
    }

    if (optionIndex === question.correctIndex) {
      const nextStreak = this.streakState() + 1;
      const points = POINTS_PER_CORRECT_ANSWER * this.multiplierFor(nextStreak);
      this.streakState.set(nextStreak);
      this.maxStreakState.update((maxStreak) => Math.max(maxStreak, nextStreak));
      this.correctCountState.update((count) => count + 1);
      this.scoreState.update((score) => score + points);
    } else {
      this.streakState.set(0);
    }

    this.selectedAnswers.update((answers) => [...answers, optionIndex]);
  }

  nextQuestion(): void {
    if (this.transitionLocked || this.status() !== 'in-progress') {
      return;
    }

    if (this.selectedAnswers().length !== this.currentIndex() + 1) {
      return;
    }

    this.lockTransition();
    this.moveToNextQuestion();
  }

  skipQuestion(): void {
    if (this.transitionLocked || this.status() !== 'in-progress') {
      return;
    }

    if (this.selectedAnswers().length !== this.currentIndex()) {
      return;
    }

    this.lockTransition();
    this.streakState.set(0);
    this.selectedAnswers.update((answers) => [...answers, null]);
    this.moveToNextQuestion();
  }

  private moveToNextQuestion(): void {
    const nextIndex = this.currentIndex() + 1;
    if (nextIndex >= this.questions().length) {
      this.resultState.set(this.buildResult());
      this.status.set('completed');
      return;
    }

    this.currentIndex.set(nextIndex);
  }

  private lockTransition(): void {
    this.transitionLocked = true;
    queueMicrotask(() => {
      this.transitionLocked = false;
    });
  }

  private buildResult(): QuizResult {
    const totalQuestions = this.questions().length;
    const correctCount = this.correctCountState();

    return {
      score: this.scoreState(),
      correctCount,
      totalQuestions,
      accuracy: this.calculateAccuracy(correctCount, totalQuestions),
      maxStreak: this.maxStreakState(),
      completedAt: Date.now(),
    };
  }

  private calculateProgress(): number {
    const totalQuestions = this.questions().length;
    if (totalQuestions === 0) {
      return 0;
    }

    if (this.status() === 'completed') {
      return 100;
    }

    return Math.round((this.selectedAnswers().length / totalQuestions) * 100);
  }

  private multiplierFor(streak: number): number {
    if (streak >= 5) {
      return 3;
    }

    if (streak >= 3) {
      return 2;
    }

    return 1;
  }

  private calculateAccuracy(correctCount: number, totalQuestions: number): number {
    if (totalQuestions === 0) {
      return 0;
    }

    return Math.round((correctCount / totalQuestions) * 100);
  }

  private isOptionIndex(value: number): value is 0 | 1 | 2 | 3 {
    return value === 0 || value === 1 || value === 2 || value === 3;
  }
}
