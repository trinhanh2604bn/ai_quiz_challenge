import { Injectable, computed, signal } from '@angular/core';
import { QUESTIONS } from '../data/questions.data';
import { AnswerRecord } from '../models/answer-record.model';
import { Difficulty, Question, QuestionCategory } from '../models/question.model';
import { QuizResult } from '../models/quiz-result.model';
import { QuizStatus } from '../models/quiz-state.model';

const POINTS_PER_CORRECT_ANSWER = 10;
const SESSION_QUESTION_COUNT = 10;

export interface AttemptScore {
  score: number;
  correctAnswers: number;
  streak: number;
  bestStreak: number;
}

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private readonly questions = signal<readonly Question[]>([]);
  private readonly categoryState = signal<QuestionCategory | null>(null);
  private readonly difficultyState = signal<Difficulty | null>(null);
  private readonly status = signal<QuizStatus>('idle');
  private readonly currentIndex = signal(0);
  private readonly selectedAnswers = signal<readonly (number | null)[]>([]);
  private readonly scoreState = signal(0);
  private readonly correctCountState = signal(0);
  private readonly streakState = signal(0);
  private readonly maxStreakState = signal(0);
  private readonly resultState = signal<QuizResult | null>(null);
  private readonly answerHistoryState = signal<readonly AnswerRecord[]>([]);
  private displayedQuestionId: string | null = null;
  private questionShownAt = 0;
  private startedAt = 0;
  private transitionLocked = false;

  readonly quizStatus = this.status.asReadonly();
  readonly category = this.categoryState.asReadonly();
  readonly difficulty = this.difficultyState.asReadonly();
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
  readonly answerHistory = this.answerHistoryState.asReadonly();
  readonly sessionQuestionCount = SESSION_QUESTION_COUNT;

  hasEnoughQuestions(category: QuestionCategory, difficulty: Difficulty): boolean {
    return this.matchingQuestions(category, difficulty).length >= SESSION_QUESTION_COUNT;
  }

  drawQuestions(category: QuestionCategory, difficulty: Difficulty): readonly Question[] | null {
    const matching = this.matchingQuestions(category, difficulty);
    if (matching.length < SESSION_QUESTION_COUNT) {
      return null;
    }

    return this.shuffle(matching).slice(0, SESSION_QUESTION_COUNT);
  }

  isCorrectSelection(correctIndex: 0 | 1 | 2 | 3, selectedAnswer: number | null): boolean {
    return selectedAnswer === correctIndex;
  }

  streakMultiplier(streak: number): number {
    return this.multiplierFor(streak);
  }

  scoreAttempt(current: AttemptScore, isCorrect: boolean): AttemptScore {
    if (!isCorrect) {
      return {
        score: current.score,
        correctAnswers: current.correctAnswers,
        streak: 0,
        bestStreak: current.bestStreak,
      };
    }

    const streak = current.streak + 1;
    return {
      score: current.score + POINTS_PER_CORRECT_ANSWER * this.multiplierFor(streak),
      correctAnswers: current.correctAnswers + 1,
      streak,
      bestStreak: Math.max(current.bestStreak, streak),
    };
  }

  startQuiz(category: QuestionCategory, difficulty: Difficulty): boolean {
    const selected = this.drawQuestions(category, difficulty);
    if (!selected) {
      return false;
    }

    this.categoryState.set(category);
    this.difficultyState.set(difficulty);
    this.questions.set(selected);
    this.currentIndex.set(0);
    this.selectedAnswers.set([]);
    this.scoreState.set(0);
    this.correctCountState.set(0);
    this.streakState.set(0);
    this.maxStreakState.set(0);
    this.resultState.set(null);
    this.answerHistoryState.set([]);
    this.displayedQuestionId = null;
    this.questionShownAt = 0;
    this.startedAt = Date.now();
    this.transitionLocked = false;
    this.status.set('in-progress');
    return true;
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

    const isCorrect = this.isCorrectSelection(question.correctIndex, optionIndex);
    this.applyAttemptScore(this.scoreAttempt(this.currentAttemptScore(), isCorrect));

    this.selectedAnswers.update((answers) => [...answers, optionIndex]);
    this.recordAttempt(question, optionIndex, isCorrect);
  }

  markQuestionDisplayed(questionId: string): void {
    if (this.status() !== 'in-progress' || this.displayedQuestionId === questionId) {
      return;
    }

    const question = this.questions()[this.currentIndex()];
    if (!question || question.id !== questionId) {
      return;
    }

    this.displayedQuestionId = questionId;
    this.questionShownAt = Date.now();
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
    this.applyAttemptScore(this.scoreAttempt(this.currentAttemptScore(), false));
    this.selectedAnswers.update((answers) => [...answers, null]);
    const question = this.questions()[this.currentIndex()];
    if (question) {
      this.recordAttempt(question, null, false);
    }
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
    const completedAt = Date.now();

    return {
      score: this.scoreState(),
      correctCount,
      totalQuestions,
      accuracy: this.calculateAccuracy(correctCount, totalQuestions),
      maxStreak: this.maxStreakState(),
      completedAt,
      timeTakenMs: this.startedAt === 0 ? 0 : Math.max(0, completedAt - this.startedAt),
    };
  }

  private recordAttempt(
    question: Question,
    selectedAnswer: number | null,
    isCorrect: boolean,
  ): void {
    const responseTime =
      this.questionShownAt === 0 ? 0 : Math.max(0, Math.round(Date.now() - this.questionShownAt));

    this.answerHistoryState.update((history) => [
      ...history,
      {
        questionId: question.id,
        category: question.category,
        difficulty: question.difficulty,
        selectedAnswer,
        correctAnswer: question.correctIndex,
        isCorrect,
        responseTime,
      },
    ]);
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

  private currentAttemptScore(): AttemptScore {
    return {
      score: this.scoreState(),
      correctAnswers: this.correctCountState(),
      streak: this.streakState(),
      bestStreak: this.maxStreakState(),
    };
  }

  private applyAttemptScore(next: AttemptScore): void {
    this.scoreState.set(next.score);
    this.correctCountState.set(next.correctAnswers);
    this.streakState.set(next.streak);
    this.maxStreakState.set(next.bestStreak);
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

  private matchingQuestions(category: QuestionCategory, difficulty: Difficulty): Question[] {
    return QUESTIONS.filter(
      (question) => question.category === category && question.difficulty === difficulty,
    );
  }

  private shuffle(questions: readonly Question[]): Question[] {
    const copy = [...questions];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      const current = copy[index];
      const swap = copy[swapIndex];
      if (current !== undefined && swap !== undefined) {
        copy[index] = swap;
        copy[swapIndex] = current;
      }
    }

    return copy;
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
