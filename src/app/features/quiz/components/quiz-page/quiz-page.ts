import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AchievementService } from '../../../game/achievements/services/achievement.service';
import { GameHudComponent } from '../../../game/components/game-hud/game-hud';
import { SettingsModalComponent } from '../../../game/components/settings-modal/settings-modal';
import { avatarById } from '../../../game/profile/data/avatars.data';
import { levelProgress } from '../../../game/profile/data/progression.data';
import { ProfileService } from '../../../game/profile/services/profile.service';
import { SettingsService } from '../../../game/services/settings.service';
import { AudioService } from '../../services/audio.service';
import { QuizService } from '../../services/quiz.service';
import { QuestionCardComponent } from '../question-card/question-card';
import { TimerComponent } from '../timer/timer';

const FEEDBACK_DELAY_MS = 800;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-quiz-page',
  imports: [GameHudComponent, QuestionCardComponent, TimerComponent, RouterLink, SettingsModalComponent],
  templateUrl: './quiz-page.html',
  styleUrl: './quiz-page.scss',
})
export class QuizPageComponent implements OnInit {
  private readonly quiz = inject(QuizService);
  private readonly audio = inject(AudioService);
  private readonly achievements = inject(AchievementService);
  private readonly profiles = inject(ProfileService);
  private readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private feedbackPending = false;
  private overlayOpener: HTMLElement | null = null;

  readonly settingsOpen = signal(false);
  readonly soundEnabled = this.settings.soundEnabled;
  readonly settingsIconSrc = 'game/home/icon-settings.png';
  readonly soundIconSrc = computed(() =>
    this.soundEnabled() ? 'game/home/icon-sound-on.png' : 'game/home/icon-sound-off.png',
  );
  readonly soundLabel = computed(() => (this.soundEnabled() ? 'Sound on' : 'Sound off'));
  readonly profile = this.profiles.profile;
  readonly hudName = computed(() => {
    const name = this.profile()?.nickname.trim() ?? '';
    return name.length > 0 ? name : 'You';
  });
  readonly hudLevel = computed(() => this.profile()?.level ?? null);
  readonly hudAvatar = computed(() => {
    const profile = this.profile();
    if (!profile) {
      return '';
    }

    return avatarById(profile.avatarId)?.glyph ?? '';
  });
  readonly hudXp = computed(() => {
    const profile = this.profile();
    return profile ? levelProgress(profile.experience) : null;
  });
  readonly hudXpLabel = computed(() => {
    const xp = this.hudXp();
    return xp ? `${xp.intoLevel} / ${xp.span} XP` : '';
  });
  readonly hudXpPercent = computed(() => this.hudXp()?.percent ?? null);

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
  readonly questionLabel = computed(
    () => `Question ${this.questionNumber()} of ${this.totalQuestions()}`,
  );
  readonly sessionDetail = computed(() => {
    const category = this.category();
    const difficulty = this.difficulty();
    if (!category || !difficulty) {
      return '';
    }

    return `${category} · ${difficulty}`;
  });
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
    inject(DestroyRef).onDestroy(() => {
      this.clearFeedbackTimer();
      this.audio.stopScene('quiz');
    });

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
      return;
    }

    this.audio.playQuizMusic();
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

    this.noteAchievements();
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

    const answeredBefore = this.quiz.answeredCount();
    this.quiz.skipQuestion();
    this.noteAchievements();
    if (this.quiz.answeredCount() === answeredBefore + 1) {
      this.audio.playTimeoutSound();
    }
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

  private noteAchievements(): void {
    const unlocked = [
      ...this.achievements.recordScore(this.quiz.score()),
      ...this.achievements.recordStreak(this.quiz.maxStreak()),
    ];
    this.profiles.recordAchievementUnlocks(unlocked.map((item) => item.id));
  }

  private openResultIfCompleted(): void {
    if (!this.quiz.isCompleted()) {
      return;
    }

    const result = this.quiz.result();
    const category = this.quiz.category();
    const difficulty = this.quiz.difficulty();
    if (result && category && difficulty) {
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

    this.audio.playCompleteSound();
    void this.router.navigate(['/result']);
  }

  openSettings(event: Event): void {
    this.audio.playButtonClick();
    const current = event.currentTarget;
    this.overlayOpener = current instanceof HTMLElement ? current : null;
    this.settingsOpen.set(true);
  }

  closeSettings(): void {
    this.audio.playButtonClick();
    this.settingsOpen.set(false);
    this.restoreOpener();
  }

  toggleSound(): void {
    this.audio.playButtonClick();
    this.settings.toggleSound();
  }

  @HostListener('document:keydown.escape')
  closeSettingsOnEscape(): void {
    if (!this.settingsOpen()) {
      return;
    }

    this.settingsOpen.set(false);
    this.restoreOpener();
  }

  private restoreOpener(): void {
    const opener = this.overlayOpener;
    this.overlayOpener = null;
    opener?.focus();
  }
}
