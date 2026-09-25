export interface QuizResult {
  readonly score: number;
  readonly correctCount: number;
  readonly totalQuestions: number;
  readonly accuracy: number;
  readonly maxStreak: number;
  readonly completedAt: number;
  readonly timeTakenMs: number;
}

export function formatQuizDuration(timeTakenMs: number): string {
  const safeMs = Number.isFinite(timeTakenMs) ? Math.max(0, timeTakenMs) : 0;
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
