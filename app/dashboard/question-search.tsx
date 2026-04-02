"use client";

import { useEffect, useMemo, useState } from "react";

import type { LeetCodeQuestion } from "@/lib/leetcode";

type QuestionsApiResponse = {
  questions?: LeetCodeQuestion[];
  updatedAt?: string;
  error?: string;
};

const PAGE_LIMIT = 30;

function getDifficultyClasses(difficulty: LeetCodeQuestion["difficulty"]): string {
  switch (difficulty) {
    case "Easy":
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
    case "Medium":
      return "border-amber-400/40 bg-amber-400/10 text-amber-300";
    case "Hard":
      return "border-rose-400/40 bg-rose-400/10 text-rose-300";
    default:
      return "border-zinc-500/40 bg-zinc-500/10 text-zinc-300";
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

export function QuestionSearch() {
  const [query, setQuery] = useState("");
  const [questions, setQuestions] = useState<LeetCodeQuestion[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const formattedUpdatedAt = formatUpdatedTime(updatedAt);

  return (
    <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Search LeetCode questions</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Search all questions or keep it empty to view the newest additions.
          </p>
        </div>
        {formattedUpdatedAt ? (
          <p className="text-xs text-zinc-500">Last updated: {formattedUpdatedAt}</p>
        ) : null}
      </div>

      <div className="mt-5">
        <label htmlFor="question-search" className="sr-only">
          Search for a LeetCode question
        </label>
        <input
          id="question-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try: binary search, two sum, dp..."
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-100 outline-none ring-cyan-400/40 transition placeholder:text-zinc-500 focus:border-cyan-300 focus:ring-2"
        />
      </div>

      <div className="mt-5 flex items-center justify-between text-sm">
        <p className="text-zinc-300">{resultLabel}</p>
        <p className="text-zinc-500">
          {isLoading ? "Loading..." : `${questions.length} question${questions.length === 1 ? "" : "s"}`}
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
          <a
            key={`${question.frontendQuestionId}-${question.titleSlug}`}
            href={`https://leetcode.com/problems/${question.titleSlug}/`}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 transition hover:border-zinc-600 hover:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  #{question.frontendQuestionId}
                </p>
                <h3 className="mt-1 text-sm font-medium text-zinc-100">{question.title}</h3>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getDifficultyClasses(
                  question.difficulty,
                )}`}
              >
                {question.difficulty}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-400">
              <span>Acceptance: {question.acRate.toFixed(1)}%</span>
              <span>{question.paidOnly ? "Premium" : "Free"}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}