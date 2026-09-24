export interface PerformanceGroup {
  label: string;
  correct: number;
  total: number;
  accuracy: number;
}

export interface PerformanceReport {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  finalScore: number;
  averageResponseTime: number;
  bestStreak: number;
  categoryPerformance: readonly PerformanceGroup[];
  difficultyPerformance: readonly PerformanceGroup[];
}
