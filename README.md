# AI Knowledge Challenge

A timed quiz about artificial intelligence. Answer one question at a time, keep a streak for bonus points, and save your best scores in the browser.

## Features

- Start a quiz and move through one question at a time
- Four answer choices per question, with automatic advance after a selection
- 15-second countdown per question, with an automatic skip on timeout
- Score, correct-answer count, and accuracy percentage
- Streak bonus: 3 correct answers in a row score 2x, and 5 in a row score 3x
- Progress bar for quiz completion
- Final result screen
- Leaderboard of the top scores, stored in `localStorage`

## Technology stack

- Angular 20
- TypeScript
- SCSS
- Standalone components
- Angular Signals
- Browser `localStorage`

## Installation

Requires Node.js 20 or later and npm.

```bash
npm install
```

## Run

Start the development server:

```bash
npm start
```

Open `http://localhost:4200/`.

Production build:

```bash
ng build
```

Build output is written to `dist/`.

## Architecture

The quiz lives under `src/app/features/quiz/`.

- `components/` — screens and presentational pieces: start screen, quiz page, question card, timer, score board, progress bar, result screen, and leaderboard. Components render state and emit user actions.
- `services/quiz.service.ts` — questions, quiz progress, scoring, streak multiplier, and result calculation.
- `services/leaderboard.service.ts` — top scores in `localStorage` (highest score first, five entries max).
- `models/` — `Question`, quiz state, quiz result, and leaderboard entry types.
- `data/questions.data.ts` — the question set.

Routes:

- `/` — start screen and previous best scores
- `/quiz` — the active question
- `/result` — final score, accuracy, and save form

UI state uses Angular Signals. Services are provided in the root injector. Styling uses component SCSS plus shared tokens in `src/styles.scss`.

## Testing strategy

Check the app after each feature with `npm start`, then walk the full quiz:

1. Start the quiz.
2. Answer questions and confirm the score updates.
3. Let the 15-second timer expire once and confirm the question is skipped.
4. Finish the quiz and review score, correct count, and accuracy.
5. Save a name to the leaderboard.
6. Refresh the browser and confirm the leaderboard is still there.

Also run `ng build` before submission and confirm the browser console has no errors.

Edge cases worth repeating: timeout with no answer, the last question, an empty leaderboard, a second attempt, and a refresh during or after a quiz.

## Agentic coding workflow

Features were built one at a time:

1. Read the requirement.
2. Explain the approach and name the files involved.
3. Implement that feature only.
4. Run the app and test the flow.
5. Review component boundaries and scoring rules.
6. Adjust only what the review found.

Business rules stay in services. Components stay focused on layout and events. Quiz logic, score rules, timer behavior, streak rules, and leaderboard storage were not mixed into later UI work.
