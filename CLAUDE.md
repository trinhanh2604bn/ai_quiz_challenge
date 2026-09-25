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

Storage: `StorageService` is the only browser `localStorage` gateway.
Profile, ranking, settings, achievements, and the leaderboard validate
JSON before use. Corrupt or unreadable values fall back to an empty
profile, the default season and board, default settings, or an empty
achievement and leaderboard state. Quiz progress, answer history, and
the performance report stay in memory for the current session.

Audio: Web Audio API oscillators in `features/game/audio/`. No audio files and
no extra audio packages. `features/quiz/services/audio.service.ts` re-exports
that service.

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
  features/game/audio/
    models/
      sound-cue.model.ts
    data/
      audio-library.data.ts
    services/
      audio.service.ts
  features/game/profile/
    models/
      player-profile.model.ts
    data/
      avatars.data.ts
      progression.data.ts
    services/
      profile.service.ts
    components/
      profile-create/
      profile-card/
      xp-bar/
      profile-page/
  features/game/ranking/
    models/
      season.model.ts
      ranking-entry.model.ts
      rank-tier.model.ts
    data/
      seasons.data.ts
      tiers.data.ts
    services/
      ranking.service.ts
    components/
      ranking-page/
      rank-badge/
      season-card/
```

Shared styles live in `src/styles.scss`. Components render state and
emit user actions. Business rules stay in services.

## Design system

Phase 6.1.1 adds reusable visual tokens and three standalone UI
components. Existing screens still use their own styles. These
components do not call services or change game state.

Tokens in `src/styles.scss`:

- Colors: `--primary`, `--secondary`, `--accent`, `--success`,
  `--danger`, `--background`, `--card`, `--text`
- Typography: `--font-heading`, `--font-body`, `.game-heading`,
  `.game-body`
- Spacing: `--space-small`, `--space-medium`, `--space-large`

Components:

- `features/game/components/game-background/` — animated gradient
  atmosphere and decorative effects
- `features/game/components/game-button/` — primary and secondary
  actions, including disabled, hover, and click states
- `features/game/components/game-card/` — bordered, shadowed container
  whose padding follows its width (small below 768px, medium from
  768px, large from 1280px)
- `features/game/components/game-hud/` — solo match status: player,
  score, streak, and progress. No services and no scoring rules
- `features/game/components/player-panel/` — battle player name, score,
  streak, and active turn. No services and no turn rules
- `features/game/components/score-popup/` — floating points gain when a
  displayed score increases

`game-ui.spec.ts` checks the foundation variants and that the composed
UI does not overflow horizontally at 390px, 768px, and 1280px.
`gameplay-arena.spec.ts` checks the arena HUD, player panels, timer
states, answer cards, and the same widths for the solo and battle
screens.

Routes in `src/app/app.routes.ts`:

- `/` — lobby
- `/profile/create` — nickname and avatar when no profile is stored
- `/profile` — level, XP, statistics, rank badge, and current rank
- `/achievements` — unlocked and locked achievements
- `/ranking` — active season and global, season, and category standings
- `/setup` — solo category and difficulty
- `/quiz` — the active question
- `/result` — score, accuracy, performance dashboard, and save form
- `/battle/setup` — two-player names, category, and difficulty
- `/battle` — the battle arena
- `/battle/result` — battle outcome
- unknown paths redirect to `/`

Feature screens load lazily with `loadComponent` or `loadChildren`.
Profile checks use `canMatch`, so a missing profile opens
`/profile/create` before a feature chunk downloads. Quiz and battle
access guards live in those lazy route files.

Game routes require a stored profile. A missing profile opens `/profile/create`.

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

Owned by `QuizService`. `GameHudComponent` shows the live solo score,
correct count, streak, and multiplier. `PlayerPanelComponent` shows
each battle player's score and streak. `ResultScreenComponent` shows
the final solo score.

- Base points are 10 per correct answer.
- Points are multiplied by the streak bonus that applies after that
  correct answer.
- Incorrect answers and timeouts award no points and reset the streak.
- Accuracy is the rounded percentage of correct answers.
- The result also stores `maxStreak` and `completedAt`.

## Timer

`TimerComponent` runs a 15-second countdown and emits `timedOut`.
The ring, warning color, and timeout label are visual only.

- `QuizPageComponent` calls `QuizService.skipQuestion()` for that
  question id.
- A timeout records an answer-history row with `selectedAnswer: null`
  and `isCorrect: false`.
- The last five seconds play a warning tone.

## Gamification

### Progress Bar

`GameHudComponent` shows solo completion from `QuizService.progress`
(answered count over the session length, 100 when completed).
`ProgressBarComponent` shows that same value on the result screen.

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
as an empty board. Saved rows may also show the profile avatar and level
from the moment they were stored. Those fields are display only.
`LeaderboardComponent` renders the list on the lobby and result screens.

### Ranking

`features/game/ranking/` stores a separate competitive board. The active
season lives in `localStorage` under `ai-quiz-active-season`. The first
season is AI Knowledge Season 1. Finished solo and battle results are
copied into `ai-quiz-ranking` with the player, avatar, level, XP, score,
category, mode, and season already on hand.

`RankingService` orders that stored board. It does not score answers,
award XP, calculate levels, unlock achievements, or change the top-five
leaderboard. Each player appears once. The row is their best score in
that board, then higher XP, then higher level, then a later recorded
time. Global covers every season. Season covers the selected season.
Category covers one category. Tiers from that score are Bronze AI,
Silver AI, Gold AI, Platinum AI, and Master AI.

The lobby opens `/ranking`. The profile page shows the rank badge and
current global rank beside the existing level.

## Audio Feedback

`AudioService` in `features/game/audio/` synthesizes music and effects
with the Web Audio API. No audio files and no extra packages.
`features/quiz/services/audio.service.ts` re-exports that service.
Playback failures are ignored so a blocked output cannot stop a match.

`SettingsService` persists `soundEnabled` and `volume` (0 to 1) in
`localStorage` under `ai-quiz-game-settings`. Turning sound off stops
music and effects. The settings dialog edits both. Background music
starts after a pointer, key, or click, because browsers block autoplay.

| Event | Caller | Method |
| --- | --- | --- |
| Menu music | lobby and setup | `playMenuMusic()` |
| Quiz music | `QuizPageComponent` | `playQuizMusic()` |
| Battle music | `BattleArenaComponent` | `playBattleMusic()` |
| Button click | `GameHomeComponent` | `playButtonClick()` |
| Setup selection | solo and battle setup | `playSelection()` |
| Correct answer | quiz and battle | `playCorrectSound()` |
| Incorrect answer | quiz and battle | `playWrongSound()` |
| Timeout | `QuizPageComponent` | `playTimeoutSound()` |
| 5 seconds or fewer left | `TimerComponent` | `playWarningSound()` |
| Quiz completed | `QuizPageComponent` | `playCompleteSound()` |
| Turn switch | `BattleArenaComponent` | `playTurnSwitch()` |
| Victory | `BattleArenaComponent` | `playVictory()` |
| Achievement unlock | `AchievementPopupComponent` | `playAchievementSound()` |

Warning tones are rate-limited to about one every 900 ms. Cue definitions
live in `audio-library.data.ts`.

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

- Hosts the active question inside the game atmosphere
- Coordinates timer, HUD, audio, and the question card
- Waits through answer feedback, then advances
- Moves to `/result` when the quiz completes

## QuestionCardComponent

- Displays the question badge, prompt, and four answer cards
- Emits the selected index
- Shows correct, incorrect, and reveal states

## GameHudComponent

- Player name, score, streak, multiplier, and progress
- Presents values it is given. It does not score or advance the quiz

## PlayerPanelComponent

- Player name, score, streak, and whether the turn is active
- Used by the battle arena. It does not switch turns or record answers

## ScoreBoardComponent

- Current score
- Correct-answer count
- Streak and multiplier
- Compact stat grid kept in the quiz feature. The arena screens use the
  HUD and player panels

## ProgressBarComponent

- Quiz completion progress

## TimerComponent

- 15-second countdown display as a circular ring
- Warning tone and warning style in the last five seconds
- Timeout style at zero, then the existing timeout event

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

- Menu, quiz, and battle music, plus UI, answer, timeout, turn, victory,
  and achievement cues
- Master volume and mute from `SettingsService`
- Gesture unlock for browser autoplay limits

## AnalyticsService

- Derives the session performance report from answer history
- `buildPerformanceReport()` is the pure function used by the service
  and by unit tests

## LeaderboardService

- Reads and writes top scores in `localStorage`
- Keeps at most five entries, highest score first
- Stores an optional avatar and level for display

## ProfileService

- Creates, loads, and saves the player profile in `localStorage` under
  `ai-player-profile`
- Updates XP, level, and statistics after a quiz, a battle, or an
  achievement unlock
- Does not score answers, run the timer, choose questions, unlock
  achievements, or rank the leaderboard

## RankingService

- Reads and writes the active season and ranking rows in `localStorage`
- Builds global, season, and category standings from stored results
- Assigns a tier from the stored score
- Does not score answers, award XP, calculate levels, unlock
  achievements, or change leaderboard order

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
- Use OnPush change detection
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

## Design System Foundation

Global tokens and `GameBackgroundComponent`, `GameButtonComponent`, and
`GameCardComponent` provide a shared visual layer. Screens are not
restyled in this phase, and quiz, battle, timer, score, and leaderboard
logic stay unchanged.

## Main Menu and Setup Redesign

Single-player setup and battle setup use the shared background, cards,
and buttons. Solo Quest opens `/setup`. Battle Arena opens `/battle/setup`. Category and difficulty choices are cards with an
active border, glow, and scale. Battle setup shows player cards and a VS
mark. Entrance, hover, selection, and button motion stop under
`prefers-reduced-motion`. Start and battle-creation behavior stay the
same.

## Homepage launcher

The lobby at `/` is a game launcher. It uses illustrated files in
`public/game/home/` for the background, logo, slogan, waving mascot,
mode art, and utility icons. Player nickname, level, experience, and the
sound setting stay live. Solo Quest, Battle Arena, profile, achievements,
ranking, the leaderboard dialog, settings, and the sound switch call the
existing lobby methods. Setup, quiz, battle, result, profile, ranking,
and achievement screens keep their own layouts. The source pack in
`public/Assets/` is not shown as a screenshot.

## Achievements

`features/game/achievements/` records unlocks in `localStorage` under
`ai-quiz-achievements`. `AchievementService` reads quiz results, battle
results, scores, and streaks that the quiz and battle flows already
store. It does not calculate points, change the timer, choose questions,
or rank the leaderboard.

The lobby opens `/achievements`. `AchievementPopupComponent` is mounted
beside the router outlet and announces each new unlock. A repeated quiz
`completedAt` or battle signature does not count twice.

Unlocks:

- First Step: finish 1 solo quiz
- AI Explorer: finish solo quizzes in 3 categories
- AI Specialist: finish a solo quiz in all 5 categories
- Knowledge Master: solo accuracy of at least 80%
- Perfect Mind: every solo question correct
- High Score: a session score of at least 100
- Hot Streak: streak of 3
- Unstoppable: streak of 5
- Hard Mode: finish a solo quiz on Hard
- First Battle: finish 1 battle
- Champion: win 1 battle
- Rival Slayer: win 3 battles

## Gameplay Arena UI

Phase 6.1.3 restyles the solo quiz and the battle arena. `GameHudComponent`
shows the solo player, score, streak, and progress. `PlayerPanelComponent`
shows both battle players, with a VS mark and a turn heading between
turns. The question card uses a gradient surface, a question badge, and
answer cards. The timer is a circular ring with warning and timeout
styles. Answer selection, correct, wrong, score-gain, question-enter,
and device-pass motion stop under `prefers-reduced-motion`.

Quiz scoring, battle turn changes, the 15-second countdown, answer
checks, and leaderboard storage stay in their existing services.

## Audio and Immersive Experience

Phase 6.2 adds `features/game/audio/` with cue models, a synthesized
library, and the upgraded `AudioService`. Menu, quiz, and battle music
loop until the scene changes or sound is turned off. Lobby buttons, setup
choices, quiz answers, quiz timeouts, battle turn changes, victory, and
achievement popups play cues from the screens that already own those
moments. Scoring, turn rules, the 15-second countdown, question selection,
achievement rules, and leaderboard ranking stay in their existing services.

## Player Profile and Progression

Phase 6.4 adds `features/game/profile/`. The profile stores a nickname,
avatar, level, experience, statistics, and timestamps in `localStorage`
under `ai-player-profile`.

XP awards:

- 50 for completing a quiz
- 10 for each correct answer in that quiz or in the local battle seat
- 100 extra for a perfect quiz
- 80 when player 1 wins a battle
- 25 for each newly unlocked achievement

Level is `floor(experience / 100) + 1`. A repeated quiz `completedAt`,
battle signature, or achievement id is ignored.

Wins and losses are battle results for player 1. A draw counts as a
battle without either result. Solo quizzes increment solo games and total
games. Accuracy is the rounded percentage of correct answers. The favorite
category is the one played most often; a tie keeps the current favorite.

The first launch opens `/profile/create`. The lobby opens `/profile`.
Leaderboard rows can show the avatar and level saved with that score.
Ranking stays highest score, then later `completedAt`.

Quiz scoring, battle scoring, the timer, question selection, achievement
unlock rules, and leaderboard ranking stay in their existing services.

## Advanced Ranking and Seasons

Phase 6.5 adds `features/game/ranking/`. A finished solo quiz or battle
copies the score, category, mode, and the profile's avatar, level, and
XP into the ranking board for the active season. The default season is
AI Knowledge Season 1.

Standings are global, season, and category. A player's row is their best
stored score in that board. Ties prefer higher XP, then higher level,
then a later recorded time. Tiers are Bronze AI, Silver AI, Gold AI,
Platinum AI, and Master AI, from that score. The ranking page shows the
season card and those boards. The profile keeps its level and adds the
rank badge and current global rank.

Quiz scoring, battle scoring, XP, level, achievement rules, and the
top-five leaderboard stay in their existing services.

## Production Optimization

Phase 7.1 prepares the release build without changing quiz rules, battle
rules, scoring, XP, ranking order, achievement rules, or audio cues.

- Routes load their screens on demand. The question bank stays out of
  the initial bundle until setup, quiz, result, or battle is opened.
- Standalone screens use OnPush. Quiz, battle, profile, ranking, and
  settings state stays in signals and computed values.
- Timers, popup delays, score popups, and audio unlock listeners are
  removed when their owner is destroyed or after the first unlock gesture.
- `StorageService` reads and writes JSON. Domain services still validate
  profile, ranking, settings, achievement, and leaderboard payloads.
- `AppErrorHandler` records a recovery banner. A failed lazy navigation
  returns to the lobby instead of leaving the outlet blank.
- Profile `canMatch` guards still send a missing profile to
  `/profile/create`. Quiz and battle guards repeat the access checks
  those screens already perform in `ngOnInit`.

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
- Settings volume and mute
- Called from the lobby, setup, quiz, battle, timer, and achievement popup

Files:

- `src/app/features/game/audio/`
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
