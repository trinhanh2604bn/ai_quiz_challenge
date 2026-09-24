# CLAUDE.md

This file provides guidance to Claude Code when working with this
repository.

# Project Overview

## Project Name

AI Knowledge Challenge

## Purpose

Build a modern Quiz Web Application using Angular 20 as an Agentic
Coding assignment.

The application allows users to:

- Answer AI-related questions
- Complete timed quiz sessions
- Track scores
- View results
- Experience gamification features

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

# Core Features

## Quiz Flow

Must support:

- Start quiz
- One question at a time
- Four answer options
- Answer selection
- Automatic next question
- Final result screen

Implemented by `StartScreenComponent`, `QuizPageComponent`, and
`QuestionCardComponent`, coordinated by `QuizService`.

Routes:

- `/` — start screen and previous best scores
- `/quiz` — the active question
- `/result` — final score, accuracy, and save form

## Scoring

Must:

- Track points
- Count correct answers
- Calculate accuracy percentage
- Display final score

Base points are 10 per correct answer, multiplied by the current streak
bonus. Incorrect answers and timeouts reset the streak and award no
points. Accuracy is the rounded percentage of correct answers.

## Timer

Must:

- Provide 15-second countdown per question
- Display remaining time
- Automatically skip after timeout

# Gamification

All three features below are implemented.

## Progress Bar

`ProgressBarComponent` shows quiz completion progress from
`QuizService`.

## Streak Bonus

Rules, applied in `QuizService`:

- 3 consecutive correct answers = 2x score
- 5 consecutive correct answers = 3x score

A wrong answer or a timeout resets the streak to zero.

## Leaderboard

- Store top scores using localStorage
- Display previous best results
- Keep the five highest scores (`LeaderboardService`)

# Technology Stack

Framework: Angular 20

Language: TypeScript

Styling: SCSS

Architecture:

- Standalone Components
- Feature-based architecture
- Angular Signals
- Services

Storage: Browser LocalStorage

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
    services/
      quiz.service.ts
      leaderboard.service.ts
    models/
      question.model.ts
      quiz-state.model.ts
      quiz-result.model.ts
      leaderboard-entry.model.ts
    data/
      questions.data.ts
```

Shared styles live in `src/styles.scss`. Components render state and
emit user actions. Business rules stay in services.

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

Claude Code must follow this sequence for every feature. Do not skip a
step, and do not start the next feature until the current one has been
verified.

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

Claude Code should not implement future phases before verification.
Finish, test, and review the current feature before planning or coding
the next one. Do not implement multiple major features in one step.

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

# Component Responsibilities

## StartScreenComponent

Responsible for:

- Introducing the quiz
- Starting a session
- Showing previous best scores

## QuizPageComponent

Responsible for:

- Hosting the active question
- Coordinating timer, score, progress, and the question card
- Moving to the result route when the quiz completes

## QuestionCardComponent

Responsible for:

- Displaying questions
- Displaying answers
- Emitting selected answer

## ScoreBoardComponent

Responsible for:

- Displaying the current score
- Displaying the correct-answer count
- Displaying the streak multiplier

## ProgressBarComponent

Responsible for:

- Displaying quiz completion progress

## QuizService

Responsible for:

- Questions
- Quiz progress
- Score calculation
- Streak multiplier
- State management

## TimerComponent

Responsible for:

- Countdown display
- Timeout events

## ResultScreenComponent

Responsible for:

- Final score
- Accuracy
- Summary
- Saving a result to the leaderboard

## LeaderboardComponent

Responsible for:

- Displaying stored top scores

## LeaderboardService

Responsible for:

- Reading and writing top scores in localStorage
- Keeping at most five entries, highest score first

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
The production build must succeed before the feature is considered done.

## Functional testing

Start the app with `ng serve` (or `npm start`) and walk the affected
flow:

Start Quiz -> Answer questions -> Timer countdown -> Score update ->
Finish quiz -> View results

Verify:

- App starts successfully
- No console errors
- UI works correctly

## Edge case testing

Repeat these cases when the change can affect them:

- Timeout without answer
- Last question completion
- Empty leaderboard
- Multiple attempts
- Browser refresh

## Regression testing

After a feature lands, re-check behavior that already worked:

- Starting a quiz still reaches the first question
- Answering still updates score, streak, and progress
- Timeout still skips the question and resets the streak
- The result screen still shows score, correct count, and accuracy
- Saving a name still updates the leaderboard
- A refresh still keeps stored leaderboard entries

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

Optional:

- Animation
- Sound effects
- Custom theme

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

## Code Quality

- Angular 20
- Standalone components
- Signals
- Service-based architecture

UI components stay presentational. `QuizService` owns quiz state,
scoring, and streak rules. `LeaderboardService` owns localStorage.
Both services are provided in the root injector and expose readonly
signals.

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

- [ ] Quiz starts correctly
- [ ] Questions display correctly
- [ ] Answers work
- [ ] Timer works
- [ ] Score works
- [ ] Results work
- [ ] Gamification works

Technical:

- [ ] Angular 20 used
- [ ] Clean components
- [ ] Services contain logic
- [ ] Responsive UI
- [ ] No console errors

Repository:

- [ ] CLAUDE.md exists
- [ ] README exists
- [ ] Git repository updated
- [ ] Project runs correctly

# Final Submission Checklist

- [ ] Angular 20 application
- [ ] CLAUDE.md included
- [ ] README included
- [ ] Git repository ready
- [ ] ng build succeeds
- [ ] Full user flow tested
- [ ] No console errors
