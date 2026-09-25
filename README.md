# AI Knowledge Challenge

A timed quiz about artificial intelligence. Pick a category and a difficulty, answer one question at a time, and save your score in the browser.

## Features

- 10-question solo sessions filtered by category and difficulty
- Four answers per question, with feedback before the next question
- Countdown by difficulty: Easy 20 seconds, Medium 15 seconds, Hard 10 seconds
- Automatic skip when the timer runs out
- Score, correct-answer count, accuracy, best streak, and total time taken
- Streak bonus: 3 correct answers in a row score 2x, and 5 in a row score 3x
- Progress through the session
- Performance dashboard, including average response time
- Top 10 leaderboard stored in `localStorage`
- Optional extras already in the app: two-player battle, player profile and XP, achievements, seasonal ranking, synthesized audio, and a game launcher

## Technology stack

- Angular 20
- TypeScript
- SCSS
- Standalone components
- Angular Signals
- Browser `localStorage`

## Setup

Requires Node.js 20 or later, npm, and Google Chrome for headless tests.

```bash
npm install
```

## Run

```bash
npm start
```

Open `http://localhost:4200/`.

Production build:

```bash
npm run build
```

That runs `ng build --configuration production`. Output is `dist/ai-knowledge-challenge/`. Source maps are off, licenses are extracted, and output files are hashed. The build copies `public/favicon.ico` and `public/game/` only. Unit-test bundles are written to `dist/test-out/` while tests run, and `npm run test:ci` removes that folder when the tests finish.

## Tests and formatting

```bash
npm test
npm run test:ci
npm run format
npm run format:check
```

`npm test` watches for changes. `npm run test:ci` runs once in Chrome headless.

## Quiz rules

1. Choose a category and a difficulty. The match starts only when both are selected and 10 questions exist for that pair.
2. Answer the current question, or let the timer expire. Easy allows 20 seconds, Medium 15, and Hard 10.
3. Correct answers score 10 points times the streak multiplier. A wrong answer or a timeout scores nothing and resets the streak.
4. After 10 questions, the result shows score, accuracy, correct count, best streak, and total time taken, such as `01:42`.
5. Save a name to the leaderboard. The board keeps the 10 highest scores and remains after a refresh. Invalid stored data is ignored.
6. The performance dashboard still shows average response time. That figure is not the total quiz time.

A refresh clears the in-progress quiz. Stored profile, leaderboard, ranking, achievements, and sound settings remain.

## Architecture

Standalone components use OnPush. Services own the rules and hold state in signals. Components render that state and emit actions.

```
src/
  main.ts                 bootstrap
  styles.scss             color, type, and spacing tokens
  styles/_motion.scss     shared celebration and arena animations
  app/
    app.routes.ts         lazy routes and profile guards
    core/
      storage/            the only localStorage gateway
      errors/             navigation recovery
      a11y/               focus trap
    features/quiz/        solo quiz, timer, results, leaderboard, analytics
    features/game/
      components/         lobby, setup, battle arena, shared HUD
      profile/            profile, XP, avatars
      ranking/            season board
      achievements/
      audio/              Web Audio oscillators
      styles/             shared hub layout
public/
  favicon.ico
  game/home/              images used by the lobby and quiz screens
```

- `QuizService` owns questions, scoring, streak, answer history, and frozen `timeTakenMs`.
- `LeaderboardService` owns the top 10 board.
- `AnalyticsService` owns average response time. It does not measure total quiz duration.
- `RankingService` owns the separate season board.
- `StorageService` is the only `localStorage` gateway.
- `questionSeconds()` maps each difficulty to its countdown.

Main routes:

- `/` — lobby
- `/setup` — solo category and difficulty
- `/quiz` — the active question
- `/result` — score, accuracy, time taken, dashboard, and save form
- `/battle/setup`, `/battle`, `/battle/result` — two-player match
- `/profile`, `/achievements`, `/ranking` — progression screens

## Assignment workflow

Features are built one at a time: read the requirement, plan the files, implement that feature, run checks, review the result, then adjust only what the review found. Claude Code hooks format an edited file and run `npm run test:ci` when a session stops. The `assignment-reviewer` subagent reviews a finished feature without rewriting the app. Agent instructions live in `CLAUDE.md`.

## Reflection

TODO: Add 2–3 sentences describing:

- what was easiest about directing Claude Code
- what was hardest
- what you learned about giving specific, testable instructions
