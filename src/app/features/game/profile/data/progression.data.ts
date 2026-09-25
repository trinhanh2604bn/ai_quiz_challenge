export const XP_PER_LEVEL = 100;

export const XP_AWARDS = {
  quizCompleted: 50,
  correctAnswer: 10,
  perfectQuiz: 100,
  battleWin: 80,
  achievementUnlocked: 25,
} as const;

export interface LevelProgress {
  level: number;
  experience: number;
  intoLevel: number;
  span: number;
  percent: number;
}

export function wholeNumber(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}

export function levelForExperience(experience: number): number {
  return Math.floor(wholeNumber(experience) / XP_PER_LEVEL) + 1;
}

export function levelProgress(experience: number): LevelProgress {
  const xp = wholeNumber(experience);
  const intoLevel = xp % XP_PER_LEVEL;
  return {
    level: levelForExperience(xp),
    experience: xp,
    intoLevel,
    span: XP_PER_LEVEL,
    percent: Math.round((intoLevel / XP_PER_LEVEL) * 100),
  };
}

export function quizExperience(totalQuestions: number, correctCount: number): number {
  const questions = wholeNumber(totalQuestions);
  const correct = Math.min(wholeNumber(correctCount), questions);
  const perfect = questions > 0 && correct === questions;
  return (
    XP_AWARDS.quizCompleted +
    correct * XP_AWARDS.correctAnswer +
    (perfect ? XP_AWARDS.perfectQuiz : 0)
  );
}

export function battleExperience(correctCount: number, won: boolean): number {
  return wholeNumber(correctCount) * XP_AWARDS.correctAnswer + (won ? XP_AWARDS.battleWin : 0);
}
