# Highest-Priority Assignment Rule

All application code must be created or modified through Claude Code.

The user directs, reviews, tests, and provides feedback.
Do not instruct the user to manually edit application code.

# Project Overview

AI Knowledge Challenge is a timed Angular 20 quiz about artificial intelligence.

A solo session works like this:

- The player picks one category and one difficulty.
- The app draws 10 questions from that pair and shows them one at a time.
- Each question has four answers. The countdown depends on difficulty.
- Correct answers score points, with a streak multiplier.
- A short answer animation and optional tones play after each choice.
- The result screen shows score, accuracy, correct count, best streak, total time taken, a save-to-leaderboard form, and a performance dashboard.

Battle mode, profile, ranking, achievements, audio, and the launcher are existing enhancements. Preserve them.

# Assignment Acceptance Criteria

The solo quiz must keep these behaviors:

- One question at a time, with four answer buttons
- Advance after an answer, with running score
- Difficulty timers: Easy 20 seconds, Medium 15 seconds, Hard 10 seconds
- Auto-skip on timeout
- Result screen with final score, accuracy percentage, and total time taken
- Gamification: progress, streak bonus, and a stored top-10 leaderboard
- Responsive UI and no console errors
- Analytics average response time stays separate from total quiz time

# Technology Stack

- Angular 20 (`@angular/core` ^20.3), TypeScript strict, SCSS
- Standalone components and OnPush change detection
- Angular Signals for quiz, leaderboard, profile, ranking, and analytics state
- Root-provided services
- `StorageService` is the only browser `localStorage` gateway
- Web Audio API oscillators in `features/game/audio/`. No audio files and no extra audio packages
- Jasmine via `ng test`. Prettier is the formatter

# Architecture

```
src/
  styles.scss             global tokens: color, type, spacing, surfaces
  styles/_motion.scss     shared result and arena animations
  app/
    core/storage/         localStorage gateway
    core/errors/          navigation recovery
    core/a11y/            focus trap
    features/quiz/        solo quiz, timer, results, leaderboard, analytics
    features/game/
      profile/            profile, XP, avatars
      ranking/            season board
      achievements/
      audio/              Web Audio oscillators
      components/         lobby, setup, battle arena, shared HUD
      styles/             shared hub layout
public/
  favicon.ico
  game/home/              images the screens actually use
```

Principles:

- Components render state and emit actions.
- Services own business rules.
- `QuizService` owns solo question selection, score, streak, answer history, and the frozen result, including `timeTakenMs`.
- `LeaderboardService` owns the top-10 board. `RankingService` owns the separate season board.
- `AnalyticsService` derives average response time and the performance report. It does not measure total quiz duration.
- `questionSeconds()` in `features/quiz/models/question-seconds.ts` is the only difficulty-to-duration map.
- Do not duplicate domain logic inside components.
- Do not add a second timer system. `TimerComponent` receives `durationSeconds` and emits `timedOut` once.

Routes in `src/app/app.routes.ts` load screens lazily. Game routes require a stored profile. `/quiz` returns home when no session is in progress and goes to `/result` when the session is already completed. `/result` returns home when there is no completed result.

# Game Rules

## Solo quiz

- Start requires a category and a difficulty, and at least 10 matching questions.
- Categories: AI Fundamentals, Machine Learning, Deep Learning, Generative AI, Prompt Engineering.
- Difficulties: Easy, Medium, Hard. The dataset has 10 questions for every pair.
- One question, four options labeled A–D. A selection locks the card, plays feedback, waits 800 ms, then calls `nextQuestion()`.
- The last answer, or a timeout on the last question, sets status to `completed`.

## Timer

`questionSeconds()` maps Easy to 20, Medium to 15, and Hard to 10. Solo quiz and battle both pass that value into `TimerComponent`.

The timer counts down, warns in the last five seconds, emits `timedOut` once, and clears its interval when the answer halts it or the component is destroyed. A new question creates a new timer. Reduced motion disables the warning animation. A timeout records `selectedAnswer: null`, awards no points, and resets the streak.

## Scoring

Owned by `QuizService`.

- Base points are 10 per correct answer.
- After 3 consecutive correct answers the multiplier is 2x. After 5 it is 3x. Otherwise it is 1x.
- Incorrect answers and timeouts award no points and reset the streak.
- `maxStreak` keeps the best run. Accuracy is the rounded percentage of correct answers.

## Total time

`startQuiz()` records the start. The result stores `timeTakenMs` when the session completes. That value does not increase afterward. A new session replaces it. Display it as `mm:ss`, for example `01:42`.

Average response time on the performance dashboard is the mean of per-question `responseTime` values. Keep it.

## Leaderboard

`LeaderboardService` stores at most 10 scores in `localStorage` under `ai-quiz-leaderboard`, highest score first. Ties break by later `completedAt`. Blank names are ignored. Invalid JSON falls back to an empty board. Saved rows may show the avatar and level from the moment they were stored.

`RankingService` is a separate board. Do not change its ordering unless the task is about ranking.

# Storage

| Key                     | Owner                | Fallback               |
| ----------------------- | -------------------- | ---------------------- |
| `ai-player-profile`     | `ProfileService`     | empty profile          |
| `ai-quiz-leaderboard`   | `LeaderboardService` | empty board, max 10    |
| `ai-quiz-active-season` | `RankingService`     | default season         |
| `ai-quiz-ranking`       | `RankingService`     | empty board            |
| `ai-quiz-achievements`  | `AchievementService` | empty unlock state     |
| `ai-quiz-game-settings` | `SettingsService`    | default sound settings |

Quiz progress, answer history, and the performance report stay in memory for the current session. A refresh clears them. Validate JSON before use.

# Where to change common rules

| Change                                        | Edit                                            |
| --------------------------------------------- | ----------------------------------------------- |
| Question count, points, streak, `timeTakenMs` | `features/quiz/services/quiz.service.ts`        |
| Countdown length                              | `features/quiz/models/question-seconds.ts`      |
| Timer display and timeout                     | `features/quiz/components/timer/`               |
| Leaderboard size or sort                      | `features/quiz/services/leaderboard.service.ts` |
| Result labels                                 | `features/quiz/components/result-screen/`       |
| Average response time                         | `features/quiz/services/analytics.service.ts`   |

Pass `questionSeconds()` into the existing timer. Do not hard-code 15 seconds in a screen.

# Development Commands

Requires Node.js 20 or later and npm. Chrome is required for `test:ci`.

```bash
npm install
npm start
npm run test:ci
npm run build
npm run format
npm run format:check
```

`npm start` serves `http://localhost:4200/`. `npm run build` runs `ng build --configuration production` and writes `dist/ai-knowledge-challenge/`. Production builds use AOT, optimization, hashed filenames, and no source maps. Copied assets are `public/favicon.ico` and `public/game/` only. `npm test` is watch mode. `npm run test:ci` runs headless and does not watch. The test runner may write `dist/test-out/`; `posttest:ci` deletes that folder so it is not left next to the production build.

`format:check` reports files that Prettier would change. The repository was not formatted all at once. Format files you edit; do not reformat unrelated files.

# Agent Workflow

Follow this sequence for every feature. Do not start the next feature until the current one has been verified.

```
Analyze requirement
        ↓
Plan
        ↓
Implement ONE feature
        ↓
Run checks
        ↓
Review
        ↓
Improve
```

1. Analyze the requirement and the current code.
2. Plan the approach, assumptions, and files.
3. Implement only that feature.
4. Run the relevant tests and, for UI changes, verify the affected flow.
5. Review component boundaries and business rules. Invoke `assignment-reviewer` after a major feature.
6. Adjust only what the review found.

Do not implement multiple major features in one step. Preserve existing behavior unless the requirement changes it.

# Feature Development Protocol

Before coding, state assumptions, unclear requirements, and trade-offs.

After coding, report changed files, what was implemented, checks that ran, and any issues. If the build or a test fails, fix that feature before moving on. Do not hide failing checks.

# Angular and Code Conventions

Always:

- Use standalone components, OnPush, strict TypeScript, and dependency injection
- Use Signals for reactive state
- Keep components small and free of business rules
- Prefer simple, readable code and surgical edits

Avoid:

- Large components and direct DOM manipulation
- Unnecessary packages or abstractions
- `any` without a reason
- Rewriting working features while adding a new one

# Hooks

Project hooks live in `.claude/settings.json`.

- After `Edit` or `Write`, `.claude/hooks/format-edited.mjs` formats that file with Prettier when the extension is supported. It writes the file only when the formatted text differs, so a second run does not keep changing it.
- On `Stop`, `.claude/hooks/validate-stop.mjs` runs `npm run test:ci`. If tests fail, it returns `decision: "block"` so Claude keeps fixing them. If `stop_hook_active` is already true, the hook exits without running tests again.

Do not add a hook that reformats the whole tree or edits the same file on every run.

# Subagent

`.claude/agents/assignment-reviewer.md` is a read-only reviewer. It reports assignment gaps, architecture violations, regressions, missing tests, TypeScript issues, and unnecessary complexity. It does not implement features.

Invoke it:

- after finishing a major feature
- before final submission
- when investigating possible regressions

# Testing

Every feature needs:

- `npm run build`
- `npm run test:ci` when logic or templates covered by unit tests change
- Functional checks for the flow that changed
- Edge cases the change can affect: timeout, last question, empty or invalid leaderboard, a second session, refresh, missing category or difficulty, fewer than 10 questions, reduced motion, and audio unavailable
- Regression checks for score, streak, the 800 ms feedback delay, results, and leaderboard persistence

Duration tests belong with `QuizService`. Timer duration tests belong with `TimerComponent` and the screens that pass `questionSeconds()`. Leaderboard tests must cover the 10-entry cap, tie-break, and invalid JSON.

# NEVER

- Never rewrite the entire project without explicit approval.
- Never remove existing functionality without requirement justification.
- Never bypass TypeScript typing with `any` without a reason.
- Never move domain logic into large UI components.
- Never skip validation after implementation.
- Never hide failing tests or builds.
- Never add unnecessary dependencies.
- Never implement several unrelated major features at once.
- Never make a git commit unless explicitly requested.
- Never tell the user to manually edit application code for this assignment.

# Definition of Done

- The requested behavior is implemented.
- Relevant unit tests pass.
- `npm run build` passes.
- No known console errors in the exercised flow.
- Solo quiz still starts, scores, times out, and reaches results.
- Results show score, accuracy, correct count, best streak, and total time taken.
- The leaderboard stores at most 10 entries and survives refresh.
- Easy, Medium, and Hard use 20, 15, and 10 seconds.
- Average response time is still shown separately.
- Profile, ranking, achievements, audio settings, battle, and lazy route guards still behave as before.
- `CLAUDE.md` and `README.md` match the implementation.
