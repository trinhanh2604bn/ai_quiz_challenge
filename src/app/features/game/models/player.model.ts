export interface PlayerAnswer {
  questionId: string;
  selectedAnswer: number | null;
  isCorrect: boolean;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  streak: number;
  bestStreak: number;
  answers: readonly PlayerAnswer[];
}
