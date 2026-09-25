export interface BattleAnswer {
  questionId: string;
  selectedAnswer: number | null;
  correctAnswer: 0 | 1 | 2 | 3;
  isCorrect: boolean;
  responseTime: number;
}
