import { Injectable, computed, inject } from '@angular/core';
import { AnswerRecord } from '../models/answer-record.model';
import { PerformanceGroup, PerformanceReport } from '../models/performance-report.model';
import { DIFFICULTY_LEVELS, QUESTION_CATEGORIES } from '../models/question.model';
import { QuizService } from './quiz.service';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly quiz = inject(QuizService);

  readonly report = computed(() => {
    const result = this.quiz.result();
    if (result === null) {
      return null;
    }

    return buildPerformanceReport(this.quiz.answerHistory(), result.score);
  });
}

export function buildPerformanceReport(
  records: readonly AnswerRecord[],
  finalScore: number,
): PerformanceReport {
  const correctAnswers = records.filter((record) => record.isCorrect).length;
  const totalQuestions = records.length;

  return {
    totalQuestions,
    correctAnswers,
    accuracy: percentage(correctAnswers, totalQuestions),
    finalScore,
    averageResponseTime: averageResponseTime(records),
    bestStreak: bestStreak(records),
    categoryPerformance: QUESTION_CATEGORIES.map((category) =>
      groupAccuracy(records, category, (record) => record.category === category),
    ).filter((group) => group.total > 0),
    difficultyPerformance: DIFFICULTY_LEVELS.map((difficulty) =>
      groupAccuracy(records, difficulty, (record) => record.difficulty === difficulty),
    ),
  };
}

function groupAccuracy(
  records: readonly AnswerRecord[],
  label: string,
  matches: (record: AnswerRecord) => boolean,
): PerformanceGroup {
  const group = records.filter(matches);
  const correct = group.filter((record) => record.isCorrect).length;

  return {
    label,
    correct,
    total: group.length,
    accuracy: percentage(correct, group.length),
  };
}

function percentage(correct: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((correct / total) * 100);
}

function averageResponseTime(records: readonly AnswerRecord[]): number {
  if (records.length === 0) {
    return 0;
  }

  const totalTime = records.reduce((sum, record) => sum + record.responseTime, 0);
  return Math.round(totalTime / records.length);
}

function bestStreak(records: readonly AnswerRecord[]): number {
  let best = 0;
  let current = 0;

  for (const record of records) {
    if (record.isCorrect) {
      current += 1;
      if (current > best) {
        best = current;
      }
    } else {
      current = 0;
    }
  }

  return best;
}
