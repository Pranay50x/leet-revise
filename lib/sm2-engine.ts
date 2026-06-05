/**
 * SM-2 Spaced Repetition Engine
 *
 * A simplified, aggressive SM-2 variant tailored for a 30-day placement sprint.
 * This module is pure (no side effects, no DB calls) and can be unit-tested in
 * isolation.
 */

export type Sm2Rating = "failed" | "tookTime" | "instant";

export type Sm2State = {
  /** How many times in a row the question was solved without heavy hints. */
  streak: number;
  /** Days to wait before the next review. */
  interval: number;
  /** ISO date string (YYYY-MM-DD) of the last rating, or null if never rated. */
  lastRatedOn: string | null;
  /** ISO date string (YYYY-MM-DD) of the next scheduled review. */
  nextReviewOn: string | null;
};

/** Maximum interval (days) — placement-sprint safety net. */
export const SM2_MAX_INTERVAL = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + Math.round(days) * DAY_MS);
}

function clampInterval(interval: number): number {
  return Math.min(Math.round(interval), SM2_MAX_INTERVAL);
}

/**
 * Given the current SM-2 state (or null for a first-time rating) and the
 * user's self-assessed rating, returns the updated SM-2 state.
 *
 * Rules
 * ─────
 * Rule 1 — Harsh Reset (Failed):
 *   Streak → 0, interval → 1. Review tomorrow.
 *
 * Rule 2 — Foundation Building (streak 1 or 2, success):
 *   streak=1: Took Time→2d  Instant→3d
 *   streak=2: Took Time→4d  Instant→7d
 *
 * Rule 3 — Exponential Multiplier (streak ≥ 3, success):
 *   Took Time → prev × 1.5
 *   Instant   → prev × 2.0
 *
 * Rule 4 — Placement Ceiling: max 30 days.
 */
export function computeNextSm2State(
  current: Sm2State | null,
  rating: Sm2Rating,
  today: Date = new Date(),
): Sm2State {
  const todayKey = toDateKey(today);
  const prevStreak = current?.streak ?? 0;
  const prevInterval = current?.interval ?? 1;

  // Rule 1: Failed — harsh reset
  if (rating === "failed") {
    return {
      streak: 0,
      interval: 1,
      lastRatedOn: todayKey,
      nextReviewOn: toDateKey(addDays(today, 1)),
    };
  }

  // Successful attempt — increment streak
  const newStreak = prevStreak + 1;

  let newInterval: number;

  if (newStreak === 1) {
    // Rule 2: First success — foundation
    newInterval = rating === "instant" ? 3 : 2;
  } else if (newStreak === 2) {
    // Rule 2: Second success — foundation
    newInterval = rating === "instant" ? 7 : 4;
  } else {
    // Rule 3: Streak ≥ 3 — exponential multiplier
    const multiplier = rating === "instant" ? 2.0 : 1.5;
    newInterval = prevInterval * multiplier;
  }

  // Rule 4: Placement ceiling
  const clampedInterval = clampInterval(newInterval);

  return {
    streak: newStreak,
    interval: clampedInterval,
    lastRatedOn: todayKey,
    nextReviewOn: toDateKey(addDays(today, clampedInterval)),
  };
}

/**
 * Returns true if the given SM-2 state has a review due today or earlier.
 */
export function isReviewDue(state: Sm2State | null, today: Date = new Date()): boolean {
  if (!state || !state.nextReviewOn) {
    return true; // Never rated → always due
  }

  return state.nextReviewOn <= toDateKey(today);
}

/**
 * Returns how many days overdue a review is (negative = still in future).
 */
export function daysOverdue(state: Sm2State | null, today: Date = new Date()): number {
  if (!state || !state.nextReviewOn) {
    return 0;
  }

  const nextMs = new Date(`${state.nextReviewOn}T00:00:00`).getTime();
  const todayMs = new Date(`${toDateKey(today)}T00:00:00`).getTime();
  return Math.round((todayMs - nextMs) / DAY_MS);
}
