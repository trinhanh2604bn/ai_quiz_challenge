import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Difficulty,
  QuestionCategory,
} from '../../../quiz/models/question.model';
import { QuizService } from '../../../quiz/services/quiz.service';
import { AudioService } from '../../audio/services/audio.service';
import { BattlePlayer } from '../../models/battle-player.model';
import { BattleService } from '../../services/battle.service';
import { GameService } from '../../services/game.service';
import { ProfileService } from '../../profile/services/profile.service';
import { ChallengePickerComponent } from '../challenge-picker/challenge-picker';
import { SetupToolbarComponent } from '../setup-toolbar/setup-toolbar';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-battle-setup',
  imports: [SetupToolbarComponent, ChallengePickerComponent],
  templateUrl: './battle-setup.html',
  styleUrls: ['../../styles/setup-screen.scss', './battle-setup.scss'],
})
export class BattleSetupComponent implements OnInit {
  private readonly game = inject(GameService);
  private readonly battle = inject(BattleService);
  private readonly quiz = inject(QuizService);
  private readonly audio = inject(AudioService);
  private readonly profiles = inject(ProfileService);
  private readonly router = inject(Router);

  readonly mode = this.game.mode;
  readonly state = this.game.state;
  readonly sessionQuestionCount = this.quiz.sessionQuestionCount;
  readonly playerOneName = signal('');
  readonly playerTwoName = signal('');
  readonly category = signal<QuestionCategory | null>(null);
  readonly difficulty = signal<Difficulty | null>(null);
  readonly unavailable = signal(false);
  readonly sessionReady = signal(false);
  readonly canStart = computed(
    () =>
      this.playerOneName().trim().length > 0 &&
      this.playerTwoName().trim().length > 0 &&
      this.category() !== null &&
      this.difficulty() !== null,
  );

  ngOnInit(): void {
    this.game.setGameMode('two-player');
    this.game.changeState('setup');
    this.audio.playMenuMusic();
    const nickname = this.profiles.profile()?.nickname ?? '';
    if (nickname.length > 0 && this.playerOneName().trim().length === 0) {
      this.playerOneName.set(nickname);
    }
  }

  updatePlayerOneName(event: Event): void {
    this.playerOneName.set(readInput(event));
    this.sessionReady.set(false);
  }

  updatePlayerTwoName(event: Event): void {
    this.playerTwoName.set(readInput(event));
    this.sessionReady.set(false);
  }

  selectCategory(category: QuestionCategory): void {
    this.audio.playSelection();
    this.category.set(category);
    this.unavailable.set(false);
    this.sessionReady.set(false);
  }

  selectDifficulty(difficulty: Difficulty): void {
    this.audio.playSelection();
    this.difficulty.set(difficulty);
    this.unavailable.set(false);
    this.sessionReady.set(false);
  }

  createSession(): void {
    const category = this.category();
    const difficulty = this.difficulty();
    const nameOne = this.playerOneName().trim();
    const nameTwo = this.playerTwoName().trim();
    if (!nameOne || !nameTwo || category === null || difficulty === null) {
      return;
    }

    const questions = this.quiz.drawQuestions(category, difficulty);
    if (!questions) {
      this.unavailable.set(true);
      this.sessionReady.set(false);
      return;
    }

    this.battle.createBattle(
      [blankPlayer('player-1', nameOne), blankPlayer('player-2', nameTwo)],
      questions,
    );
    this.unavailable.set(false);
    this.sessionReady.set(true);
    this.game.changeState('playing');
    void this.router.navigate(['/battle']);
  }

  goBack(): void {
    this.game.changeState('home');
    void this.router.navigate(['/']);
  }
}

function readInput(event: Event): string {
  const target = event.target;
  return target instanceof HTMLInputElement ? target.value : '';
}

function blankPlayer(id: string, name: string): BattlePlayer {
  return {
    id,
    name,
    score: 0,
    correctAnswers: 0,
    streak: 0,
    bestStreak: 0,
    answers: [],
  };
}
