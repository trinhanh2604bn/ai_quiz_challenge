import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from '../../../../core/storage/storage.service';
import { QuestionCategory, isQuestionCategory } from '../../../quiz/models/question.model';
import { BattleSession } from '../../models/battle-session.model';
import { DEFAULT_ACHIEVEMENTS } from '../data/achievements.data';
import {
  Achievement,
  AchievementDefinition,
  AchievementProgress,
  AchievementState,
  BattleAchievementFacts,
  QuizCompletionFacts,
} from '../models/achievement.model';

export const ACHIEVEMENT_STORAGE_KEY = 'ai-quiz-achievements';

@Injectable({
  providedIn: 'root',
})
export class AchievementService {
  private readonly storage = inject(StorageService);
  private readonly state = signal<AchievementState>(readStoredState(this.storage));
  private readonly queue = signal<readonly Achievement[]>([]);
  private readonly activePopupState = signal<Achievement | null>(null);

  readonly activePopup = this.activePopupState.asReadonly();
  readonly achievements = computed(() => {
    const unlockedAt = this.state().unlockedAt;
    return DEFAULT_ACHIEVEMENTS.map((definition) => toAchievement(definition, unlockedAt));
  });
  readonly unlocked = computed(() => this.achievements().filter((item) => item.unlocked));
  readonly locked = computed(() => this.achievements().filter((item) => !item.unlocked));

  recordQuizCompletion(facts: QuizCompletionFacts): readonly Achievement[] {
    const progress = this.state().progress;
    if (progress.seenQuizIds.includes(facts.completedAt)) {
      return [];
    }

    const categories = progress.categories.includes(facts.category)
      ? progress.categories
      : [...progress.categories, facts.category];
    const perfect = facts.totalQuestions > 0 && facts.correctCount === facts.totalQuestions;

    return this.commit({
      unlockedAt: this.state().unlockedAt,
      progress: {
        ...progress,
        quizzesCompleted: progress.quizzesCompleted + 1,
        categories,
        bestScore: Math.max(progress.bestScore, wholeNumber(facts.score)),
        bestAccuracy: Math.max(progress.bestAccuracy, wholeNumber(facts.accuracy)),
        perfectCount: progress.perfectCount + (perfect ? 1 : 0),
        bestStreak: Math.max(progress.bestStreak, wholeNumber(facts.maxStreak)),
        hardQuizzesCompleted: progress.hardQuizzesCompleted + (facts.difficulty === 'Hard' ? 1 : 0),
        seenQuizIds: [...progress.seenQuizIds, facts.completedAt],
      },
    });
  }

  recordScore(score: number): readonly Achievement[] {
    const nextScore = wholeNumber(score);
    const progress = this.state().progress;
    if (nextScore <= progress.bestScore) {
      return [];
    }

    return this.commit({
      unlockedAt: this.state().unlockedAt,
      progress: { ...progress, bestScore: nextScore },
    });
  }

  recordStreak(streak: number): readonly Achievement[] {
    const nextStreak = wholeNumber(streak);
    const progress = this.state().progress;
    if (nextStreak <= progress.bestStreak) {
      return [];
    }

    return this.commit({
      unlockedAt: this.state().unlockedAt,
      progress: { ...progress, bestStreak: nextStreak },
    });
  }

  recordBattleCompletion(facts: BattleAchievementFacts): readonly Achievement[] {
    const signature = facts.signature.trim();
    const progress = this.state().progress;
    if (signature.length === 0 || progress.seenBattleIds.includes(signature)) {
      return [];
    }

    const bestScore = facts.scores.reduce(
      (highest, score) => Math.max(highest, wholeNumber(score)),
      progress.bestScore,
    );

    return this.commit({
      unlockedAt: this.state().unlockedAt,
      progress: {
        ...progress,
        battlesCompleted: progress.battlesCompleted + 1,
        battlesWon: progress.battlesWon + (facts.won ? 1 : 0),
        bestScore,
        bestStreak: Math.max(progress.bestStreak, wholeNumber(facts.bestStreak)),
        seenBattleIds: [...progress.seenBattleIds, signature],
      },
    });
  }

  dismissPopup(): void {
    this.activePopupState.set(null);
    this.promoteQueue();
  }

  private commit(next: AchievementState): readonly Achievement[] {
    const unlockedAt: Record<string, number> = { ...next.unlockedAt };
    const newly: Achievement[] = [];
    const unlockedOn = Date.now();

    for (const definition of DEFAULT_ACHIEVEMENTS) {
      if (unlockedAt[definition.id] !== undefined || !meets(definition, next.progress)) {
        continue;
      }

      unlockedAt[definition.id] = unlockedOn;
      newly.push({ ...definition, unlocked: true, unlockedAt: unlockedOn });
    }

    const state: AchievementState = { unlockedAt, progress: next.progress };
    this.state.set(state);
    writeStoredState(this.storage, state);
    this.enqueue(newly);
    return newly;
  }

  private enqueue(items: readonly Achievement[]): void {
    if (items.length === 0) {
      return;
    }

    this.queue.update((current) => [...current, ...items]);
    this.promoteQueue();
  }

  private promoteQueue(): void {
    if (this.activePopupState() !== null) {
      return;
    }

    const [next, ...rest] = this.queue();
    if (!next) {
      return;
    }

    this.queue.set(rest);
    this.activePopupState.set(next);
  }
}

export function battleAchievementFacts(
  session: BattleSession,
  won: boolean,
): BattleAchievementFacts {
  const players = session.players
    .map((player) => {
      const answers = player.answers
        .map(
          (answer) =>
            `${answer.questionId}:${answer.selectedAnswer ?? 'none'}:${answer.isCorrect ? 1 : 0}`,
        )
        .join(',');
      return `${player.id}:${player.score}:${player.correctAnswers}:${player.bestStreak}:${answers}`;
    })
    .join('|');
  const questions = session.questions.map((question) => question.id).join(',');

  return {
    signature: `${questions}#${players}`,
    won,
    scores: [session.players[0].score, session.players[1].score],
    bestStreak: Math.max(session.players[0].bestStreak, session.players[1].bestStreak),
  };
}

function toAchievement(
  definition: AchievementDefinition,
  unlockedAt: Readonly<Record<string, number>>,
): Achievement {
  const timestamp = unlockedAt[definition.id] ?? null;
  return {
    ...definition,
    unlocked: timestamp !== null,
    unlockedAt: timestamp,
  };
}

function meets(definition: AchievementDefinition, progress: AchievementProgress): boolean {
  switch (definition.conditionType) {
    case 'quizzes-completed':
      return progress.quizzesCompleted >= definition.target;
    case 'categories-played':
      return progress.categories.length >= definition.target;
    case 'accuracy-reached':
      return progress.bestAccuracy >= definition.target;
    case 'score-reached':
      return progress.bestScore >= definition.target;
    case 'perfect-score':
      return progress.perfectCount >= definition.target;
    case 'streak-reached':
      return progress.bestStreak >= definition.target;
    case 'battles-completed':
      return progress.battlesCompleted >= definition.target;
    case 'battles-won':
      return progress.battlesWon >= definition.target;
    case 'hard-quizzes-completed':
      return progress.hardQuizzesCompleted >= definition.target;
  }
}

function wholeNumber(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}

function emptyProgress(): AchievementProgress {
  return {
    quizzesCompleted: 0,
    categories: [],
    bestScore: 0,
    bestAccuracy: 0,
    perfectCount: 0,
    bestStreak: 0,
    battlesCompleted: 0,
    battlesWon: 0,
    hardQuizzesCompleted: 0,
    seenQuizIds: [],
    seenBattleIds: [],
  };
}

function readStoredState(storage: StorageService): AchievementState {
  return (
    storage.readJson(ACHIEVEMENT_STORAGE_KEY, (parsed) => {
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return null;
      }

      return normalizeState(parsed as Record<string, unknown>);
    }).value ?? { unlockedAt: {}, progress: emptyProgress() }
  );
}

function normalizeState(value: Record<string, unknown>): AchievementState {
  const progressValue =
    typeof value['progress'] === 'object' && value['progress'] !== null
      ? (value['progress'] as Record<string, unknown>)
      : {};
  const knownIds = new Set(DEFAULT_ACHIEVEMENTS.map((definition) => definition.id));
  const unlockedAt: Record<string, number> = {};
  const storedUnlocks = value['unlockedAt'];
  if (typeof storedUnlocks === 'object' && storedUnlocks !== null) {
    for (const [id, timestamp] of Object.entries(storedUnlocks)) {
      if (knownIds.has(id) && typeof timestamp === 'number' && Number.isFinite(timestamp)) {
        unlockedAt[id] = timestamp;
      }
    }
  }

  return {
    unlockedAt,
    progress: {
      quizzesCompleted: count(progressValue['quizzesCompleted']),
      categories: categories(progressValue['categories']),
      bestScore: count(progressValue['bestScore']),
      bestAccuracy: count(progressValue['bestAccuracy']),
      perfectCount: count(progressValue['perfectCount']),
      bestStreak: count(progressValue['bestStreak']),
      battlesCompleted: count(progressValue['battlesCompleted']),
      battlesWon: count(progressValue['battlesWon']),
      hardQuizzesCompleted: count(progressValue['hardQuizzesCompleted']),
      seenQuizIds: numbers(progressValue['seenQuizIds']),
      seenBattleIds: strings(progressValue['seenBattleIds']),
    },
  };
}

function writeStoredState(storage: StorageService, state: AchievementState): void {
  storage.writeJson(ACHIEVEMENT_STORAGE_KEY, state);
}

function count(value: unknown): number {
  return wholeNumber(typeof value === 'number' ? value : 0);
}

function categories(value: unknown): QuestionCategory[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set<QuestionCategory>();
  for (const item of value) {
    if (isQuestionCategory(item)) {
      unique.add(item);
    }
  }

  return [...unique];
}

function numbers(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item));
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}
