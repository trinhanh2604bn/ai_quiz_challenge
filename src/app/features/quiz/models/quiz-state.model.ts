export type QuizStatus = 'idle' | 'in-progress' | 'completed';

export interface QuizState {
  status: QuizStatus;
  currentIndex: number;
  score: number;
  correctCount: number;
  answeredCount: number;
  streak: number;
}
