import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { questionSeconds } from '../../../quiz/models/question-seconds';
import { Question } from '../../../quiz/models/question.model';
import { QuestionCardComponent } from '../../../quiz/components/question-card/question-card';
import { TimerComponent } from '../../../quiz/components/timer/timer';
import { AudioService } from '../../audio/services/audio.service';
import { AttemptScore, QuizService } from '../../../quiz/services/quiz.service';
import { BattlePlayer } from '../../models/battle-player.model';
import { BattleSession } from '../../models/battle-session.model';
import {
  AchievementService,
  battleAchievementFacts,
} from '../../achievements/services/achievement.service';
import { ProfileService, battleProgressFacts } from '../../profile/services/profile.service';
import { BattleService } from '../../services/battle.service';
import { GameService } from '../../services/game.service';
import { BattleTransitionComponent } from '../battle-transition/battle-transition';
import { PlayerPanelComponent } from '../player-panel/player-panel';

const FEEDBACK_DELAY_MS = 800;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-battle-arena',
  imports: [PlayerPanelComponent, QuestionCardComponent, TimerComponent, BattleTransitionComponent],
  templateUrl: './battle-arena.html',
  styleUrl: './battle-arena.scss',
})
export class BattleArenaComponent implements OnInit {
  private readonly battle = inject(BattleService);
  private readonly quiz = inject(QuizService);
  private readonly game = inject(GameService);
  private readonly audio = inject(AudioService);
  private readonly achievements = inject(AchievementService);
  private readonly profiles = inject(ProfileService);
  private readonly router = inject(Router);
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private turnLocked = false;
  private turnStartedAt = 0;

  readonly session = this.battle.session;
  readonly state = this.battle.state;
  readonly currentPlayer = this.battle.currentPlayer;
  readonly currentQuestion = this.battle.currentQuestion;
  readonly selectedOption = signal<number | null>(null);
  readonly showingFeedback = signal(false);
  readonly questionNumber = computed(() => (this.session()?.currentQuestionIndex ?? 0) + 1);
  readonly totalQuestions = computed(() => this.session()?.questions.length ?? 0);
  readonly players = computed(() => this.session()?.players ?? []);
  readonly multiplier = computed(() =>
    this.quiz.streakMultiplier(this.currentPlayer()?.streak ?? 0),
  );
  readonly secondsFor = questionSeconds;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.clearFeedbackTimer();
      this.audio.stopScene('battle');
    });
  }

  ngOnInit(): void {
    const session = this.battle.session();
    if (!session || session.questions.length === 0) {
      void this.router.navigate(['/battle/setup']);
      return;
    }

    if (session.state === 'completed') {
      void this.router.navigate(['/battle/result']);
      return;
    }

    if (session.state === 'waiting') {
      this.battle.startBattle();
    }

    this.turnStartedAt = Date.now();
    this.audio.playBattleMusic();
  }

  onAnswerSelected(optionIndex: number): void {
    if (!this.canAnswer() || !this.isOptionIndex(optionIndex)) {
      return;
    }

    const question = this.battle.currentQuestion();
    const player = this.battle.currentPlayer();
    if (!question || !player) {
      return;
    }

    this.turnLocked = true;
    const isCorrect = this.quiz.isCorrectSelection(question.correctIndex, optionIndex);
    this.remember(question, player, optionIndex, isCorrect);
    this.selectedOption.set(optionIndex);
    this.showingFeedback.set(true);
    if (isCorrect) {
      this.audio.playCorrectSound();
    } else {
      this.audio.playWrongSound();
    }

    this.feedbackTimer = setTimeout(() => this.advanceAfterAnswer(), FEEDBACK_DELAY_MS);
  }

  onTimeout(questionId: string): void {
    if (!this.canAnswer()) {
      return;
    }

    const question = this.battle.currentQuestion();
    const player = this.battle.currentPlayer();
    if (!question || !player || question.id !== questionId) {
      return;
    }

    this.turnLocked = true;
    this.remember(question, player, null, false);
    this.advanceAfterAnswer();
  }

  continueTurn(): void {
    this.selectedOption.set(null);
    this.showingFeedback.set(false);
    this.turnLocked = false;
    this.battle.startBattle();
    this.turnStartedAt = Date.now();
  }

  private canAnswer(): boolean {
    return !this.turnLocked && !this.showingFeedback() && this.battle.state() === 'player-turn';
  }

  private remember(
    question: Question,
    player: BattlePlayer,
    selectedAnswer: number | null,
    isCorrect: boolean,
  ): void {
    const stats = this.quiz.scoreAttempt(attemptScore(player), isCorrect);
    this.battle.recordAnswer(
      {
        questionId: question.id,
        selectedAnswer,
        correctAnswer: question.correctIndex,
        isCorrect,
        responseTime: this.elapsedMs(),
      },
      stats,
    );
    this.noteAchievements();
  }

  private advanceAfterAnswer(): void {
    this.clearFeedbackTimer();
    this.showingFeedback.set(false);
    this.selectedOption.set(null);

    const session = this.battle.session();
    if (!session || session.state !== 'player-turn') {
      return;
    }

    const lastQuestion = session.currentQuestionIndex >= session.questions.length - 1;
    if (session.currentPlayerIndex === 1 && lastQuestion) {
      this.finishBattle(session);
      return;
    }

    if (session.currentPlayerIndex === 1) {
      this.battle.nextQuestion();
      this.battle.switchPlayer();
      this.audio.playTurnSwitch();
      return;
    }

    this.battle.switchPlayer();
    this.audio.playTurnSwitch();
  }

  private finishBattle(session: BattleSession): void {
    const [first, second] = session.players;
    const winnerId =
      first.score === second.score ? null : first.score > second.score ? first.id : second.id;
    this.battle.completeBattle(winnerId);
    const completed = this.battle.session();
    if (completed) {
      const facts = battleAchievementFacts(completed, winnerId !== null);
      const unlocked = this.achievements.recordBattleCompletion(facts);
      this.profiles.recordBattleCompletion(battleProgressFacts(completed, facts.signature));
      this.profiles.recordAchievementUnlocks(unlocked.map((item) => item.id));
    }
    this.game.changeState('result');
    this.audio.playVictory();
    void this.router.navigate(['/battle/result']);
  }

  private noteAchievements(): void {
    const player = this.battle.currentPlayer();
    if (!player) {
      return;
    }

    const unlocked = [
      ...this.achievements.recordScore(player.score),
      ...this.achievements.recordStreak(player.bestStreak),
    ];
    this.profiles.recordAchievementUnlocks(unlocked.map((item) => item.id));
  }

  private elapsedMs(): number {
    if (this.turnStartedAt === 0) {
      return 0;
    }

    return Math.max(0, Math.round(Date.now() - this.turnStartedAt));
  }

  private clearFeedbackTimer(): void {
    if (this.feedbackTimer !== null) {
      clearTimeout(this.feedbackTimer);
      this.feedbackTimer = null;
    }
  }

  private isOptionIndex(value: number): value is 0 | 1 | 2 | 3 {
    return value === 0 || value === 1 || value === 2 || value === 3;
  }
}

function attemptScore(player: BattlePlayer): AttemptScore {
  return {
    score: player.score,
    correctAnswers: player.correctAnswers,
    streak: player.streak,
    bestStreak: player.bestStreak,
  };
}
