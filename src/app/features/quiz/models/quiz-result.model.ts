export interface QuizResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  maxStreak: number;
  completedAt: number;
  timeTakenMs: number;
}

export function formatQuizDuration(timeTakenMs: number): string {
  const safeMs = Number.isFinite(timeTakenMs) ? Math.max(0, timeTakenMs) : 0;
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
