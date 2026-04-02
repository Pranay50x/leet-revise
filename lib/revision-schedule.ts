import type { LeetCodeQuestion } from "@/lib/leetcode";

export type ScheduledQuestion = {
  id: string;
  question: LeetCodeQuestion;
  solvedOn: string;
  reviewDates: string[];
  completedReviewCounts: Record<string, number>;
  createdAt: string;
  updatedAt: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const DIFFICULTY_REVIEW_OFFSETS: Record<LeetCodeQuestion["difficulty"], number[]> = {
  Easy: [3, 6, 9],
  Medium: [2, 4, 6],
  Hard: [1, 2, 3],
};

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(baseDate: Date, days: number): Date {
  return new Date(baseDate.getTime() + days * DAY_MS);
}

export function buildReviewDates(difficulty: LeetCodeQuestion["difficulty"], solvedOn: Date): string[] {
  const offsets = DIFFICULTY_REVIEW_OFFSETS[difficulty];
  return offsets.map((offset) => toDateKey(addDays(solvedOn, offset)));
}

export function createScheduleEntry(question: LeetCodeQuestion, now: Date = new Date()): ScheduledQuestion {
  const isoNow = now.toISOString();

  return {
    id: `${question.titleSlug}-${now.getTime()}`,
    question,
    solvedOn: toDateKey(now),
    reviewDates: buildReviewDates(question.difficulty, now),
    completedReviewCounts: {},
    createdAt: isoNow,
    updatedAt: isoNow,
  };
}

export function sortAndDedupeDateKeys(dateKeys: string[]): string[] {
  return [...new Set(dateKeys)].sort((a, b) => a.localeCompare(b));
}