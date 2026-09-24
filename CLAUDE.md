# CLAUDE.md

This file provides guidance to Claude Code when working with this
repository.

# Project Overview

## Project Name

AI Knowledge Challenge

## Purpose

A timed Angular 20 quiz about artificial intelligence, built as an
Agentic Coding assignment.

A session works like this:

- The player picks one category and one difficulty on the start screen.
- The app draws 10 questions from that pair and shows them one at a time.
- Each question has four answers and a 15-second countdown.
- Correct answers score points, with a streak multiplier.
- A short answer animation and optional tones play after each choice.
- The result screen shows score, accuracy, a save-to-leaderboard form,
  and a performance dashboard for that session.

Claude Code should work as an engineering assistant:

- Analyze requirements before coding
- Create plans
- Implement incrementally
- Review and test changes

# Assignment Requirements

The final submission must contain:

- A working web application
- A Git repository
- CLAUDE.md documentation
- README documentation

The development process must demonstrate:

- Task decomposition
- Incremental implementation
- Code review
- Testing workflow

# Technology Stack

Framework: Angular 20 (`@angular/core` ^20.3)

Language: TypeScript (strict)

Styling: SCSS

Architecture:

- Standalone components
- Feature-based layout under `src/app/features/quiz/`
- Angular Signals for quiz, leaderboard, and analytics state
- Root-provided services

Storage: Browser `localStorage` for the leaderboard only. Quiz progress,
answer history, and the performance report live in memory for the
current session.

Audio: Web Audio API oscillators in `AudioService`. No audio files and
no extra audio packages.

Tests: Jasmine via `ng test`. Analytics report math is covered in
`analytics.service.spec.ts`.

# Current Project Structure

```
src/app/
  app.ts
  app.config.ts
  app.routes.ts
  features/quiz/
    components/
      start-screen/
      quiz-page/
      question-card/
      timer/
      score-board/
      progress-bar/
      result-screen/
      leaderboard/
      performance-dashboard/
    services/
      quiz.service.ts
      leaderboard.service.ts
      audio.service.ts
      analytics.service.ts
    models/
      question.model.ts
      answer-record.model.ts
      quiz-state.model.ts
      quiz-result.model.ts
      leaderboard-entry.model.ts
      performance-report.model.ts
    data/
      questions.data.ts
```

Shared styles live in `src/styles.scss`. Components render state and
emit user actions. Business rules stay in services.

Routes in `src/app/app.routes.ts`:

- `/` — start screen, category and difficulty selectors, leaderboard
- `/quiz` — the active question
- `/result` — score, accuracy, performance dashboard, and save form
- unknown paths redirect to `/`

`/quiz` returns home when no session is in progress, and goes to
`/result` when the session is already completed. `/result` returns home
when there is no completed result.

# Feature Mapping

## Quiz Flow

Implemented by `StartScreenComponent`, `QuizPageComponent`, and
`QuestionCardComponent`, coordinated by `QuizService`.

- Start requires a category and a difficulty.
- `QuizService.startQuiz()` shuffles matching questions and keeps 10
  (`sessionQuestionCount`).
- One question at a time, four options labeled A–D.
- A selection locks the card, plays feedback, waits 800 ms, then calls
  `nextQuestion()`.
- The last answer or a timeout on the last question sets status to
  `completed` and navigates to `/result`.

## Scoring

Owned by `QuizService`. Displayed by `ScoreBoardComponent` during the
quiz and `ResultScreenComponent` at the end.

- Base points are 10 per correct answer.
- Points are multiplied by the streak bonus that applies after that
  correct answer.
- Incorrect answers and timeouts award no points and reset the streak.
- Accuracy is the rounded percentage of correct answers.
- The result also stores `maxStreak` and `completedAt`.

## Timer

`TimerComponent` runs a 15-second countdown and emits `timedOut`.

- `QuizPageComponent` calls `QuizService.skipQuestion()` for that
  question id.
- A timeout records an answer-history row with `selectedAnswer: null`
  and `isCorrect: false`.
- The last five seconds play a warning tone.

## Gamification

### Progress Bar

`ProgressBarComponent` shows completion from `QuizService.progress`
(answered count over the session length, 100 when completed).

### Streak Bonus

Applied in `QuizService.multiplierFor()`:

- 3 consecutive correct answers = 2x
- 5 consecutive correct answers = 3x
- Otherwise 1x

A wrong answer or a timeout resets the streak to zero. `maxStreak`
keeps the best run for the result screen.

### Leaderboard

`LeaderboardService` stores the top five scores in `localStorage` under
`ai-quiz-leaderboard`, highest score first. Ties break by later
`completedAt`. Blank names are ignored. Invalid stored JSON is treated
as an empty board. `LeaderboardComponent` renders the list on the start
and result screens.

## Audio Feedback

`AudioService` synthesizes short tones. Playback failures are ignored so
a blocked or missing audio output cannot stop the quiz.

| Event | Caller | Method |
| --- | --- | --- |
| Correct answer | `QuizPageComponent` | `playCorrectSound()` |
| Incorrect answer | `QuizPageComponent` | `playWrongSound()` |
| 5 seconds or fewer left | `TimerComponent` | `playWarningSound()` |
| Quiz completed | `QuizPageComponent` | `playCompleteSound()` |

Warning tones are rate-limited to about one every 900 ms.

## Answer Feedback Animation

`QuestionCardComponent` paints each option as `default`, `correct`,
`incorrect`, or `reveal`.

- The chosen correct option pulses and shows a check.
- A wrong choice shakes and shows an X. The real answer is revealed
  with a check.
- Other options stay idle and disabled.
- `QuizPageComponent` holds this state for 800 ms (`FEEDBACK_DELAY_MS`)
  before advancing.
- `prefers-reduced-motion: reduce` disables the animations.
- A timeout skips the question without this selection animation.

## Category System

Categories, defined in `question.model.ts`:

- AI Fundamentals
- Machine Learning
- Deep Learning
- Generative AI
- Prompt Engineering

Every question has a `category`. The start screen requires one. The
session filters `QUESTIONS` to that category and the chosen difficulty.
The quiz header shows both labels.

## Difficulty System

Difficulties: Easy, Medium, and Hard.

The start button stays disabled until both selectors have a value and
`QuizService.hasEnoughQuestions()` is true (at least 10 matches). If a
pair is too small, the start screen says there are not enough questions.
The current dataset has 10 questions for every category and difficulty
pair, so every pair can start.

## Analytics Dashboard

`QuizService` appends an `AnswerRecord` on every answer and timeout,
including response time measured from `markQuestionDisplayed()`.

`AnalyticsService.report` builds a `PerformanceReport` from that history
once a result exists. `PerformanceDashboardComponent` renders it on the
result screen:

- Final score and accuracy
- Correct count out of the session total
- Average response time
- Best streak
- Accuracy by category (groups with no attempts are omitted)
- Accuracy by difficulty (Easy, Medium, and Hard are always listed;
  unattempted levels show "Not attempted")

A normal session uses one category and one difficulty, so category
performance is a single group and the other difficulties are unattempted.
The report is in-memory only. A refresh clears it. The leaderboard is
the stored record.

## Dataset

`src/app/features/quiz/data/questions.data.ts` holds 150 questions:
5 categories × 3 difficulties × 10 questions. Question ids follow
`{prefix}-{difficulty}-{n}` (for example `af-easy-1`).

# Data Models

## Question

`src/app/features/quiz/models/question.model.ts`

```ts
interface Question {
  id: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  category: QuestionCategory;
  difficulty: Difficulty;
}
```

`QuestionCategory` and `Difficulty` are the unions exported from
`QUESTION_CATEGORIES` and `DIFFICULTY_LEVELS`.

## Answer history

`src/app/features/quiz/models/answer-record.model.ts`

```ts
interface AnswerRecord {
  questionId: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  selectedAnswer: number | null;
  correctAnswer: 0 | 1 | 2 | 3;
  isCorrect: boolean;
  responseTime: number;
}
```

`QuizService.answerHistory` is a readonly signal of these records, in
answer order. `selectedAnswer` is `null` on timeout. `responseTime` is
milliseconds from when the question was shown, or `0` if that timestamp
was never set. `QuizState.answerHistory` uses the same type.

## Related models

- `QuizState` — status (`idle` | `in-progress` | `completed`), index,
  score, counts, streak, and answer history.
- `QuizResult` — score, correct count, total questions, accuracy,
  max streak, and `completedAt`.
- `LeaderboardEntry` — player name, score, accuracy, and `completedAt`.
- `PerformanceReport` / `PerformanceGroup` — dashboard totals plus
  per-category and per-difficulty accuracy.

# Component and Service Responsibilities

## StartScreenComponent

- Introduces the quiz
- Collects category and difficulty
- Starts a session only when 10 matching questions exist
- Shows previous best scores

## QuizPageComponent

- Hosts the active question
- Coordinates timer, score, progress, audio, and the question card
- Waits through answer feedback, then advances
- Moves to `/result` when the quiz completes

## QuestionCardComponent

- Displays the question and four answers
- Emits the selected index
- Shows correct, incorrect, and reveal states

## ScoreBoardComponent

- Current score
- Correct-answer count
- Streak and multiplier

## ProgressBarComponent

- Quiz completion progress

## TimerComponent

- 15-second countdown display
- Warning tone in the last five seconds
- Timeout event

## ResultScreenComponent

- Final score, accuracy, correct count, and best streak
- Hosts the performance dashboard
- Saves a named result to the leaderboard

## PerformanceDashboardComponent

- Renders a `PerformanceReport`
- Formats response time and group accuracy

## LeaderboardComponent

- Displays stored top scores

## QuizService

- Question selection for the chosen category and difficulty
- Progress, score, streak, and max streak
- Answer history and response time
- Result calculation

## AudioService

- Optional correct, wrong, warning, and completion tones

## AnalyticsService

- Derives the session performance report from answer history
- `buildPerformanceReport()` is the pure function used by the service
  and by unit tests

## LeaderboardService

- Reads and writes top scores in `localStorage`
- Keeps at most five entries, highest score first

# Development Commands

Requires Node.js 20 or later and npm.

Install dependencies:

```bash
npm install
```

Start the development server (opens at `http://localhost:4200/`):

```bash
ng serve
```

`npm start` runs the same command.

Production build (output in `dist/`):

```bash
ng build
```

Unit tests:

```bash
ng test
```

Run `ng build` before submission. Confirm the browser console has no
errors while exercising the quiz.

# Agent Workflow

Follow this sequence for every feature. Do not skip a step, and do not
start the next feature until the current one has been verified.

```
Analyze requirement
        ↓
Create implementation plan
        ↓
Implement one feature
        ↓
Run tests
        ↓
Review changes
        ↓
Improve
```

1. Analyze requirement — read the assignment item and the current code.
2. Create implementation plan — name the approach, assumptions, and files.
3. Implement one feature — change only what that feature needs.
4. Run tests — build, functional checks, edge cases, and regressions.
5. Review changes — check component boundaries and business rules.
6. Improve — adjust only what the review found.

Do not implement future phases before verification. Finish, test, and
review the current feature before planning or coding the next one. Do
not implement multiple major features in one step.

The shipped enhancements (audio, answer animation, category and
difficulty, the 150-question set, and the analytics dashboard) are
already in the tree. Treat them as existing behavior to preserve.

# Feature Development Protocol

## Before coding

- Understand requirements.
- Explain approach.
- Identify affected files.

Also state assumptions, unclear requirements, and trade-offs before
writing code.

## After coding

- Run build/test.
- Report changed files.
- Report implementation summary.
- Report issues.

If the build or a test fails, fix that feature before moving on. Do not
hide failing checks or leave them for a later phase.

# Angular Rules

Always:

- Use standalone components
- Use strict TypeScript typing
- Use dependency injection
- Separate UI and business logic
- Keep components small
- Use Signals for reactive state

Avoid:

- Large components
- Direct DOM manipulation
- Unnecessary packages
- Unnecessary abstractions
- `any` type without reason

# Coding Principles

## Think Before Coding

Before implementation:

- State assumptions
- Identify unclear requirements
- Explain trade-offs

## Simplicity First

Prefer:

- Simple solutions
- Readable code
- Minimal dependencies

Do not:

- Over-engineer
- Add unrequested features
- Create unnecessary abstractions

## Surgical Changes

When editing:

- Modify only required files
- Avoid unrelated refactoring
- Preserve existing functionality

# Testing Requirements

Every feature implementation must include:

- Build verification
- Functional testing
- Edge case testing
- Regression testing

## Build verification

Run:

```bash
ng build
```

Also run `ng test` when the change affects logic covered by unit tests.
`analytics.service.spec.ts` covers report accuracy, response-time
averages (including timeouts), streaks, and category and difficulty
breakdowns. The production build must succeed before the feature is
considered done.

## Functional testing

Start the app with `ng serve` (or `npm start`) and walk the affected
flow:

Choose category and difficulty -> Start Quiz -> Answer questions ->
See answer animation and hear feedback -> Timer countdown -> Score
update -> Finish quiz -> View results and the performance dashboard ->
Save a name

Verify:

- App starts successfully
- No console errors
- UI works correctly
- The dashboard matches the session (score, accuracy, response time,
  streak, category, difficulty)

## Edge case testing

Repeat these cases when the change can affect them:

- Timeout without answer
- Last question completion
- Empty leaderboard
- Multiple attempts
- Browser refresh (leaderboard remains; in-memory quiz state does not)
- Start with no category or difficulty selected
- A category and difficulty pair with fewer than 10 questions
- Reduced-motion preference (answer animations off, quiz still advances)
- Audio unavailable (quiz still completes)

## Regression testing

After a feature lands, re-check behavior that already worked:

- Starting a quiz still reaches the first question of the chosen pair
- Answering still updates score, streak, progress, and answer history
- Feedback still shows for about 800 ms, then advances
- Timeout still skips the question and resets the streak
- The result screen still shows score, correct count, accuracy, and
  the performance dashboard
- Saving a name still updates the leaderboard
- A refresh still keeps stored leaderboard entries

# Enhancement History

These landed after the base quiz, timer, scoring, and leaderboard.
Each one preserved the previous flow.

## Audio Feedback

`AudioService` added Web Audio tones for correct answers, wrong answers,
the last five seconds of the timer, and quiz completion. No new
dependency.

## Answer Animation

`QuestionCardComponent` highlights the chosen answer and reveals the
correct option. `QuizPageComponent` delays the next question by 800 ms
so the animation can be seen. Reduced motion skips the motion.

## Category & Difficulty

Questions gained `category` and `difficulty`. The start screen requires
both before a 10-question filtered session can begin.

## Dataset Expansion

The question file grew to 150 items, 10 for each of the 15 category and
difficulty pairs, so every selector combination can start.

## Analytics Dashboard

Each attempt is stored as an `AnswerRecord`. `AnalyticsService` turns
that history into a `PerformanceReport`, and
`PerformanceDashboardComponent` shows it on the result screen.

# Evaluation Criteria

## Quiz Flow (25 points)

Check:

- Questions display
- Four answers available
- Navigation works
- Quiz completes

## Scoring (15 points)

Check:

- Correct answers increase score
- Incorrect answers handled
- Final score correct
- Accuracy displayed

## Timer (15 points)

Check:

- 15-second countdown
- Correct updates
- Auto skip

## Gamification (20 points)

Check:

- Progress bar
- Streak bonus
- Leaderboard

## CLAUDE.md (10 points)

Check:

- Clear instructions
- Workflow documented
- Coding rules defined

## Code Quality (10 points)

Check:

- Responsive UI
- Clean architecture
- No console errors

## Creativity (5 points)

Implemented:

- Answer feedback animation
- Sound effects via the Web Audio API
- Category and difficulty selection
- Session analytics dashboard

# Assignment Requirement Mapping

## Quiz Flow

- StartScreenComponent
- QuizPageComponent
- QuestionCardComponent

Files:

- `src/app/features/quiz/components/start-screen/`
- `src/app/features/quiz/components/quiz-page/`
- `src/app/features/quiz/components/question-card/`
- `src/app/app.routes.ts`

## Scoring

- QuizService
- ScoreBoardComponent
- ResultScreenComponent

Files:

- `src/app/features/quiz/services/quiz.service.ts`
- `src/app/features/quiz/components/score-board/`
- `src/app/features/quiz/components/result-screen/`

## Timer

- TimerComponent

File:

- `src/app/features/quiz/components/timer/`

Timeout calls `QuizService.skipQuestion()`.

## Gamification

- ProgressBarComponent
- Streak logic
- LeaderboardService

Files:

- `src/app/features/quiz/components/progress-bar/`
- Streak multiplier in `src/app/features/quiz/services/quiz.service.ts`
- `src/app/features/quiz/services/leaderboard.service.ts`
- `src/app/features/quiz/components/leaderboard/`

## Audio Feedback

- AudioService
- Called from QuizPageComponent and TimerComponent

File:

- `src/app/features/quiz/services/audio.service.ts`

## Answer Feedback Animation

- QuestionCardComponent option states
- 800 ms delay in QuizPageComponent

Files:

- `src/app/features/quiz/components/question-card/`
- `src/app/features/quiz/components/quiz-page/quiz-page.ts`

## Category and Difficulty

- Question category and difficulty fields
- Start-screen selectors
- Filtered session in QuizService

Files:

- `src/app/features/quiz/models/question.model.ts`
- `src/app/features/quiz/data/questions.data.ts`
- `src/app/features/quiz/components/start-screen/`
- `src/app/features/quiz/services/quiz.service.ts`

## Analytics Dashboard

- AnswerRecord history
- AnalyticsService
- PerformanceDashboardComponent on the result screen

Files:

- `src/app/features/quiz/models/answer-record.model.ts`
- `src/app/features/quiz/models/performance-report.model.ts`
- `src/app/features/quiz/services/analytics.service.ts`
- `src/app/features/quiz/components/performance-dashboard/`
- `src/app/features/quiz/components/result-screen/`

## Code Quality

- Angular 20
- Standalone components
- Signals
- Service-based architecture

UI components stay presentational. `QuizService` owns quiz state,
scoring, streak rules, and answer history. `LeaderboardService` owns
localStorage. `AudioService` owns tones. `AnalyticsService` owns the
derived performance report. Services are provided in the root injector
and expose readonly signals.

# Git Rules

Use meaningful commits:

- `feat: create quiz flow`
- `feat: add timer`
- `feat: implement leaderboard`
- `fix: resolve scoring issue`

Commit only when the user asks for a commit.

# NEVER

Claude Code must never:

- Rewrite the whole project without approval
- Remove existing features
- Add unnecessary dependencies
- Modify configuration without explanation
- Put all logic in app.component
- Skip testing
- Generate huge changes without review
- Ignore assignment requirements
- Implement the next feature before the current one is verified

# Final Review Checklist

Functionality:

- [ ] Quiz starts only after category and difficulty are chosen
- [ ] A session has 10 questions from that pair
- [ ] Questions display correctly with four answers
- [ ] Answer animation shows, then the next question loads
- [ ] Timer counts down from 15 and skips on timeout
- [ ] Score and streak update, including 2x and 3x
- [ ] Results show score, correct count, accuracy, and best streak
- [ ] Performance dashboard matches the session
- [ ] Leaderboard saves and survives refresh

Technical:

- [ ] Angular 20 used
- [ ] Clean components
- [ ] Services contain logic
- [ ] Responsive UI
- [ ] No console errors
- [ ] `ng build` succeeds

Repository:

- [ ] CLAUDE.md exists
- [ ] README exists
- [ ] Git repository updated
- [ ] Project runs correctly

# Final Submission Checklist

- [ ] Angular 20 application
- [ ] CLAUDE.md included and aligned with the final app
- [ ] README included
- [ ] Git repository ready
- [ ] `ng build` succeeds
- [ ] Full user flow tested, including category, difficulty, feedback,
      results, dashboard, and leaderboard
- [ ] No console errors
- [ ] Quiz flow, scoring, timer, and gamification still work
- [ ] Audio feedback works, and the quiz still finishes if audio fails
- [ ] Answer feedback animation works, including reduced motion
- [ ] Category and difficulty selection filters the 10-question session
- [ ] Dataset has 150 questions, 10 per category and difficulty pair
- [ ] Analytics dashboard shows score, accuracy, response time, streak,
      and category and difficulty breakdowns
