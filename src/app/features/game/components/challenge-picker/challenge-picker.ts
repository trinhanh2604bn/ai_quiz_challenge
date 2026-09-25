import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  DIFFICULTY_LEVELS,
  Difficulty,
  QuestionCategory,
} from '../../../quiz/models/question.model';

export interface CategoryCard {
  id: QuestionCategory;
  blurb: string;
  tone: 'fundamentals' | 'learning' | 'deep' | 'generative' | 'prompt';
}

export const CATEGORY_CARDS: readonly CategoryCard[] = [
  {
    id: 'AI Fundamentals',
    blurb: 'Basic concepts and real-world applications',
    tone: 'fundamentals',
  },
  {
    id: 'Machine Learning',
    blurb: 'Algorithms, data and smart systems',
    tone: 'learning',
  },
  {
    id: 'Deep Learning',
    blurb: 'Neural networks and modern AI',
    tone: 'deep',
  },
  {
    id: 'Generative AI',
    blurb: 'Create, generate and explore with AI',
    tone: 'generative',
  },
  {
    id: 'Prompt Engineering',
    blurb: 'Write better prompts for amazing results',
    tone: 'prompt',
  },
];

export const DIFFICULTY_COPY: Record<Difficulty, string> = {
  Easy: 'Great for beginners',
  Medium: 'A balanced challenge',
  Hard: 'For AI experts',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-challenge-picker',
  imports: [],
  templateUrl: './challenge-picker.html',
  styleUrl: './challenge-picker.scss',
})
export class ChallengePickerComponent {
  readonly category = input<QuestionCategory | null>(null);
  readonly difficulty = input<Difficulty | null>(null);
  readonly categorySelected = output<QuestionCategory>();
  readonly difficultySelected = output<Difficulty>();

  readonly categories = CATEGORY_CARDS;
  readonly difficulties = DIFFICULTY_LEVELS;
  readonly difficultyCopy = DIFFICULTY_COPY;
}
