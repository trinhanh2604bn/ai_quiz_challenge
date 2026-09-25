import { Difficulty } from './question.model';

export const QUESTION_SECONDS: Record<Difficulty, number> = {
  Easy: 20,
  Medium: 15,
  Hard: 10,
};

export function questionSeconds(difficulty: Difficulty): number {
  return QUESTION_SECONDS[difficulty];
}
