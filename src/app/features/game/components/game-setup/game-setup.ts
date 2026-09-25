import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  DIFFICULTY_LEVELS,
  QUESTION_CATEGORIES,
  Difficulty,
  QuestionCategory,
} from '../../../quiz/models/question.model';
import { QuizService } from '../../../quiz/services/quiz.service';
import { AudioService } from '../../audio/services/audio.service';
import { GameService } from '../../services/game.service';
import { GameBackgroundComponent } from '../game-background/game-background';
import { GameButtonComponent } from '../game-button/game-button';
import { GameCardComponent } from '../game-card/game-card';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-game-setup',
  imports: [GameBackgroundComponent, GameCardComponent, GameButtonComponent],
  templateUrl: './game-setup.html',
  styleUrls: ['../../styles/setup-screen.scss', './game-setup.scss'],
})
export class GameSetupComponent implements OnInit {
  private readonly game = inject(GameService);
  private readonly quiz = inject(QuizService);
  private readonly audio = inject(AudioService);
  private readonly router = inject(Router);

  readonly categories = QUESTION_CATEGORIES;
  readonly difficulties = DIFFICULTY_LEVELS;
  readonly mode = this.game.mode;
  readonly state = this.game.state;
  readonly sessionQuestionCount = this.quiz.sessionQuestionCount;
  readonly category = signal<QuestionCategory | null>(null);
  readonly difficulty = signal<Difficulty | null>(null);
  readonly unavailable = signal(false);
  readonly canStart = computed(() => this.category() !== null && this.difficulty() !== null);

  ngOnInit(): void {
    if (this.game.mode() === 'two-player') {
      void this.router.navigate(['/']);
      return;
    }

    this.game.setGameMode('single-player');
    this.game.changeState('setup');
    this.audio.playMenuMusic();
  }

  selectCategory(category: QuestionCategory): void {
    this.audio.playSelection();
    this.category.set(category);
    this.unavailable.set(false);
  }

  selectDifficulty(difficulty: Difficulty): void {
    this.audio.playSelection();
    this.difficulty.set(difficulty);
    this.unavailable.set(false);
  }

  startGame(): void {
    const category = this.category();
    const difficulty = this.difficulty();
    if (category === null || difficulty === null) {
      return;
    }

    if (!this.quiz.startQuiz(category, difficulty)) {
      this.unavailable.set(true);
      return;
    }

    this.unavailable.set(false);
    this.game.changeState('playing');
    void this.router.navigate(['/quiz']);
  }

  goBack(): void {
    this.game.changeState('home');
    void this.router.navigate(['/']);
  }
}
