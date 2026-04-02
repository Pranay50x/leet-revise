"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LeetCodeQuestion } from "@/lib/leetcode";
import type { ScheduledQuestion } from "@/lib/revision-schedule";

type QuestionsApiResponse = {
  questions?: LeetCodeQuestion[];
  updatedAt?: string;
  error?: string;
};

type ScheduleApiResponse = {
  schedule?: ScheduledQuestion[];
  item?: ScheduledQuestion;
  error?: string;
};

const PAGE_LIMIT = 30;

function getDifficultyVariant(difficulty: LeetCodeQuestion["difficulty"]): "easy" | "medium" | "hard" | "default" {
  switch (difficulty) {
    case "Easy":
      return "easy";
    case "Medium":
      return "medium";
    case "Hard":
      return "hard";
    default:
      return "default";
  }
}

function formatUpdatedTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function highlightTitle(title: string, query: string): ReactNode {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return title;
  }

  const lowerTitle = title.toLowerCase();
  const lowerQuery = normalizedQuery.toLowerCase();
  const index = lowerTitle.indexOf(lowerQuery);

  if (index === -1) {
    return title;
  }

  const before = title.slice(0, index);
  const match = title.slice(index, index + normalizedQuery.length);
  const after = title.slice(index + normalizedQuery.length);

  return (
    <>
      {before}
      <mark className="rounded bg-cyan-400/20 px-1 text-cyan-200">{match}</mark>
      {after}
    </>
  );
}

export function QuestionSearch() {
  const [query, setQuery] = useState("");
  const [questions, setQuestions] = useState<LeetCodeQuestion[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduledQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadSchedule = async () => {
      try {
        const response = await fetch("/api/revision/schedule", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = (await response.json()) as ScheduleApiResponse;

        if (!response.ok) {
          return;
        }

        setSchedule(payload.schedule ?? []);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
      }
    };

    void loadSchedule();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_LIMIT));

        if (query.trim()) {
          params.set("query", query.trim());
        }

        const response = await fetch(`/api/leetcode/questions?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = (await response.json()) as QuestionsApiResponse;

        if (!response.ok) {
          setQuestions([]);
          setUpdatedAt(null);
          setErrorMessage(payload.error ?? "Unable to load questions right now.");
          return;
        }

        setQuestions(payload.questions ?? []);
        setUpdatedAt(payload.updatedAt ?? null);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setQuestions([]);
        setUpdatedAt(null);
        setErrorMessage("Unable to load questions right now.");
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const resultLabel = useMemo(() => {
    if (query.trim()) {
      return `Results for "${query.trim()}"`;
    }

    return "Latest LeetCode questions";
  }, [query]);

  const scheduledCount = useMemo(
    () => schedule.reduce((total, item) => total + item.reviewDates.length, 0),
    [schedule],
  );

  function handleAddSolvedQuestion(question: LeetCodeQuestion): void {
    const alreadyScheduled = schedule.some((entry) => entry.question.titleSlug === question.titleSlug);

    if (alreadyScheduled) {
      setToastMessage("Already in calendar.");
      return;
    }

    setIsSaving(true);

    void (async () => {
      try {
        const response = await fetch("/api/revision/schedule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question }),
        });

        const payload = (await response.json()) as ScheduleApiResponse;

        if (!response.ok || !payload.item) {
          setToastMessage(payload.error ?? "Could not save to calendar.");
          return;
        }

        setSchedule((current) => [payload.item as ScheduledQuestion, ...current]);
        setToastMessage("Saved to calendar.");
      } catch {
        setToastMessage("Could not save to calendar.");
      } finally {
        setIsSaving(false);
      }
    })();
  }

  const formattedUpdatedAt = formatUpdatedTime(updatedAt);

  return (
    <section className="mt-8 space-y-5">
      {toastMessage ? (
        <div className="pointer-events-none fixed right-6 top-6 z-50 animate-[fade-in_200ms_ease-out_both] rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-100 shadow-[0_12px_30px_-16px_rgba(6,182,212,0.8)]">
          {toastMessage}
        </div>
      ) : null}

      <Card className="bg-linear-to-br from-zinc-900/80 via-zinc-900/65 to-cyan-950/20 shadow-[0_18px_70px_-45px_rgba(6,182,212,0.7)]">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Search and Add Solved Questions</CardTitle>
              <CardDescription className="mt-1">
                Type to search instantly. Add solved questions to your spaced-revision calendar.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="px-3 py-1 text-xs text-zinc-300">
                {scheduledCount} reviews planned
              </Badge>
              <Link href="/calendar">
                <Button size="sm">Open month calendar</Button>
              </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
      <CardHeader className="pb-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle className="text-xl">Log Today&apos;s Solved Questions</CardTitle>
          <CardDescription className="mt-1">
            Search LeetCode, then add solved questions to generate your revision schedule.
          </CardDescription>
        </div>
        {formattedUpdatedAt ? (
          <p className="text-xs text-zinc-500">Last updated: {formattedUpdatedAt}</p>
        ) : null}
      </div>
      </CardHeader>

      <CardContent className="pt-0">
      <div>
        <label htmlFor="question-search" className="sr-only">
          Search for a LeetCode question
        </label>
        <Input
          id="question-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try: arrays, two sum, sliding window..."
          className="h-11 rounded-xl bg-zinc-950/80"
        />
      </div>

      <div className="mt-5 flex items-center justify-between text-sm">
        <p className="text-zinc-300">{resultLabel}</p>
        <p className="text-zinc-500">
          {isLoading ? "Searching..." : `${questions.length} question${questions.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      {!isLoading && !errorMessage && questions.length === 0 ? (
        <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-5 text-sm text-zinc-400">
          No questions matched your search.
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {questions.map((question) => (
          <article
            key={`${question.frontendQuestionId}-${question.titleSlug}`}
            className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 transition duration-300 hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  #{question.frontendQuestionId}
                </p>
                <h3 className="mt-1 text-sm font-medium text-zinc-100">
                  <a
                    href={`https://leetcode.com/problems/${question.titleSlug}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-cyan-300"
                  >
                    {highlightTitle(question.title, query)}
                  </a>
                </h3>
              </div>
              <Badge variant={getDifficultyVariant(question.difficulty)}>{question.difficulty}</Badge>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-400">
              <span>
                Acceptance: {question.acRate.toFixed(1)}% | {question.paidOnly ? "Premium" : "Free"}
              </span>
              <Button
                size="sm"
                onClick={() => handleAddSolvedQuestion(question)}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Solved Today"}
              </Button>
            </div>
          </article>
        ))}
      </div>
      </CardContent>
      </Card>
    </section>
  );
}