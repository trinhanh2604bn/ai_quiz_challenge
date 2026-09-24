import { Difficulty, QuestionCategory } from './question.model';

export interface AnswerRecord {
  questionId: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  selectedAnswer: number | null;
  correctAnswer: 0 | 1 | 2 | 3;
  isCorrect: boolean;
  responseTime: number;
}
