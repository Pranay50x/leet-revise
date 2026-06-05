"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { daysOverdue, isReviewDue, type Sm2Rating } from "@/lib/sm2-engine";
import type { LeetCodeQuestion } from "@/lib/leetcode";
import type { ScheduledQuestion } from "@/lib/revision-schedule";
import type { Sm2Record } from "@/lib/sm2-store";

// ─── API response types ────────────────────────────────────────────────────────

type ScheduleApiResponse = {
  schedule?: ScheduledQuestion[];
  item?: ScheduledQuestion;
  deleted?: boolean;
  error?: string;
};

type Sm2ApiResponse = {
  states?: Sm2Record[];
  state?: Sm2Record;
  error?: string;
};

type QuestionsApiResponse = {
  questions?: LeetCodeQuestion[];
  error?: string;
};

// ─── Domain types ─────────────────────────────────────────────────────────────

type MergedQuestion = {
  scheduleId: string;   // revision_schedule _id
  titleSlug: string;
  title: string;
  difficulty: LeetCodeQuestion["difficulty"];
  acRate: number;
  topicTags: LeetCodeQuestion["topicTags"];
  sm2: Sm2Record;       // always present — SM-2 record is the queue's source of truth
  addedOn: string;      // solvedOn from schedule
};

type CompletedEntry = {
  titleSlug: string;
  title: string;
  rating: Sm2Rating;
  nextReviewOn: string | null;
  streak: number;
};

type ActiveTab = "due" | "upcoming" | "all";

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date();
const TODAY_KEY = TODAY.toISOString().slice(0, 10);

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function difficultyVariant(d: LeetCodeQuestion["difficulty"]) {
  return d === "Easy" ? "easy" : d === "Medium" ? "medium" : "hard";
}

function formatRelativeDate(dateKey: string | null): string {
  if (!dateKey) return "—";
  const diff = Math.round(
    (new Date(`${dateKey}T00:00:00`).getTime() -
      new Date(`${TODAY_KEY}T00:00:00`).getTime()) /
      86_400_000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return `in ${diff}d`;
}

function ratingMeta(r: Sm2Rating) {
  return {
    failed:   { label: "Failed",    icon: "✕", cls: "border-rose-500/50 bg-rose-500/8 text-rose-200 hover:bg-rose-500/18 hover:border-rose-400" },
    tookTime: { label: "Took Time", icon: "⏱", cls: "border-amber-500/50 bg-amber-500/8 text-amber-200 hover:bg-amber-500/18 hover:border-amber-400" },
    instant:  { label: "Instant",   icon: "⚡", cls: "border-emerald-500/50 bg-emerald-500/8 text-emerald-200 hover:bg-emerald-500/18 hover:border-emerald-400" },
  }[r];
}

// ─── Streak bar ───────────────────────────────────────────────────────────────

function StreakBar({ streak }: { streak: number }) {
  const MAX = 7;
  const filled = Math.min(streak, MAX);
  return (
    <span className="inline-flex items-center gap-[3px]" title={`Streak: ${streak}`}>
      {Array.from({ length: MAX }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-4 rounded-full transition-all",
            i < filled ? "bg-amber-400" : "bg-zinc-700",
          )}
        />
      ))}
      {streak > MAX && (
        <span className="ml-1 text-[10px] font-bold text-amber-400">+{streak - MAX}</span>
      )}
    </span>
  );
}

// ─── Rating button ────────────────────────────────────────────────────────────

function RatingBtn({ rating, onClick, disabled }: { rating: Sm2Rating; onClick: () => void; disabled: boolean }) {
  const meta = ratingMeta(rating);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 rounded-xl border py-2.5 text-[11px] font-semibold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-40 select-none",
        meta.cls,
      )}
    >
      <span className="text-sm leading-none">{meta.icon}</span>
      <span>{meta.label}</span>
    </button>
  );
}

// ─── Question card (due) ──────────────────────────────────────────────────────

function DueCard({
  item,
  isRating,
  onRate,
  onEdit,
}: {
  item: MergedQuestion;
  isRating: boolean;
  onRate: (r: Sm2Rating) => void;
  onEdit: () => void;
}) {
  const overdue = daysOverdue(item.sm2, TODAY);
  const isNew = !item.sm2;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-zinc-950/80 transition-all duration-200 hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.6)]",
        isNew
          ? "border-cyan-500/35"
          : overdue > 0
          ? "border-rose-500/35"
          : "border-zinc-800 hover:border-zinc-700",
      )}
    >
      {/* top shimmer */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[2px]",
          isNew
            ? "bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent"
            : overdue > 0
            ? "bg-gradient-to-r from-transparent via-rose-400/60 to-transparent"
            : "bg-gradient-to-r from-transparent via-zinc-600/30 to-transparent",
        )}
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <a
              href={`https://leetcode.com/problems/${item.titleSlug}/`}
              target="_blank"
              rel="noreferrer"
              className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 transition-colors hover:text-cyan-300"
              title={item.title}
            >
              {item.title}
            </a>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant={difficultyVariant(item.difficulty)}>{item.difficulty}</Badge>
              {isNew && (
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-semibold text-cyan-400">
                  FIRST REVIEW
                </span>
              )}
              {overdue > 0 && !isNew && (
                <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[9px] font-semibold text-rose-400">
                  {overdue}D OVERDUE
                </span>
              )}
            </div>
          </div>
          {/* Edit button */}
          <button
            type="button"
            onClick={onEdit}
            title="Edit / Remove"
            className="shrink-0 rounded-lg p-1.5 text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.4" />
              <circle cx="8" cy="8" r="1.4" />
              <circle cx="8" cy="13" r="1.4" />
            </svg>
          </button>
        </div>

        {/* SM2 state */}
        {item.sm2 && (
          <div className="space-y-1">
            <StreakBar streak={item.sm2.streak} />
            <p className="text-[10px] text-zinc-600">
              Streak {item.sm2.streak} · Interval {item.sm2.interval}d
              {item.sm2.lastRatedOn && ` · Last rated ${item.sm2.lastRatedOn}`}
            </p>
          </div>
        )}

        {/* Tags */}
        {item.topicTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.topicTags.slice(0, 3).map((tag) => (
              <span
                key={tag.slug}
                className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[9px] text-zinc-500"
              >
                {tag.name}
              </span>
            ))}
            {item.topicTags.length > 3 && (
              <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[9px] text-zinc-600">
                +{item.topicTags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rating buttons */}
      <div className="flex gap-1.5 border-t border-zinc-800/80 p-3">
        <RatingBtn rating="failed" onClick={() => onRate("failed")} disabled={isRating} />
        <RatingBtn rating="tookTime" onClick={() => onRate("tookTime")} disabled={isRating} />
        <RatingBtn rating="instant" onClick={() => onRate("instant")} disabled={isRating} />
      </div>

      {/* Loading overlay */}
      {isRating && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-zinc-950/70">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-400" />
        </div>
      )}
    </article>
  );
}

// ─── Upcoming / All row ───────────────────────────────────────────────────────

function QueueRow({
  item,
  showRating,
  isRating,
  onRate,
  onEdit,
}: {
  item: MergedQuestion;
  showRating: boolean;
  isRating: boolean;
  onRate: (r: Sm2Rating) => void;
  onEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isNew = !item.sm2;
  const isDue = isReviewDue(item.sm2, TODAY);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 transition hover:border-zinc-700">
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
      >
        {/* Status indicator */}
        <div
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            isDue ? "bg-rose-400" : isNew ? "bg-cyan-400" : "bg-zinc-600",
          )}
        />

        {/* Title */}
        <div className="min-w-0 flex-1">
          <a
            href={`https://leetcode.com/problems/${item.titleSlug}/`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block truncate text-sm font-medium text-zinc-200 hover:text-cyan-300 transition-colors"
          >
            {item.title}
          </a>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge variant={difficultyVariant(item.difficulty)} className="text-[9px]">
              {item.difficulty}
            </Badge>
            {item.sm2 && <StreakBar streak={item.sm2.streak} />}
            {isNew && (
              <span className="text-[9px] text-cyan-500">Not yet rated</span>
            )}
          </div>
        </div>

        {/* Next review */}
        <div className="shrink-0 text-right">
          <p
            className={cn(
              "text-xs font-semibold",
              isDue ? "text-rose-400" : "text-cyan-300",
            )}
          >
            {formatRelativeDate(item.sm2?.nextReviewOn ?? null)}
          </p>
          {item.sm2?.nextReviewOn && (
            <p className="text-[10px] text-zinc-600">{item.sm2.nextReviewOn}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-1.5 text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
            title="Edit / Remove"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.4" />
              <circle cx="8" cy="8" r="1.4" />
              <circle cx="8" cy="13" r="1.4" />
            </svg>
          </button>
          <span
            className={cn(
              "text-zinc-600 transition",
              expanded ? "rotate-180" : "",
            )}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </div>
      </div>

      {/* Expanded: rating buttons */}
      {expanded && showRating && (
        <div className="flex gap-1.5 border-t border-zinc-800/60 px-4 py-3">
          <RatingBtn rating="failed" onClick={() => onRate("failed")} disabled={isRating} />
          <RatingBtn rating="tookTime" onClick={() => onRate("tookTime")} disabled={isRating} />
          <RatingBtn rating="instant" onClick={() => onRate("instant")} disabled={isRating} />
        </div>
      )}
    </div>
  );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditModal({
  item,
  open,
  onClose,
  onRemove,
  onResetSm2,
  isWorking,
}: {
  item: MergedQuestion | null;
  open: boolean;
  onClose: () => void;
  onRemove: () => void;
  onResetSm2: () => void;
  isWorking: boolean;
}) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="leading-snug">{item.title}</DialogTitle>
          <DialogDescription>
            Manage this question in your SM-2 review schedule.
          </DialogDescription>
        </DialogHeader>

        {/* SM2 snapshot */}
        {item.sm2 && (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Current SM-2 State</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-amber-300">{item.sm2.streak}</p>
                <p className="text-[10px] text-zinc-500">Streak</p>
              </div>
              <div>
                <p className="text-xl font-bold text-cyan-300">{item.sm2.interval}d</p>
                <p className="text-[10px] text-zinc-500">Interval</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-300">{formatRelativeDate(item.sm2.nextReviewOn)}</p>
                <p className="text-[10px] text-zinc-500">Next review</p>
              </div>
            </div>
            <StreakBar streak={item.sm2.streak} />
          </div>
        )}

        {!item.sm2 && (
          <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
            No SM-2 ratings yet — will appear in your Due queue.
          </div>
        )}

        {/* Tags */}
        {item.topicTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.topicTags.map((t) => (
              <span key={t.slug} className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                {t.name}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <p className="mt-2 text-[11px] text-zinc-600">
          Added on {item.addedOn} · {item.acRate.toFixed(1)}% acceptance
        </p>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          {item.sm2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetSm2}
              disabled={isWorking}
            >
              Reset SM-2 State
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={onRemove} disabled={isWorking}>
            Remove from Schedule
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" size="sm">Cancel</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add questions panel ──────────────────────────────────────────────────────

function AddQuestionsPanel({
  onAdd,
  existingSlugs,
}: {
  onAdd: (q: LeetCodeQuestion) => Promise<void>;
  existingSlugs: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeetCodeQuestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingSlug, setAddingSlug] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const params = new URLSearchParams({ limit: "20" });
        if (query.trim()) params.set("query", query.trim());

        const res = await fetch(`/api/leetcode/questions?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = (await res.json()) as QuestionsApiResponse;

        if (!res.ok) {
          setSearchError(payload.error ?? "Could not load questions.");
          setResults([]);
          return;
        }

        setResults(payload.questions ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setSearchError("Search failed.");
        }
      } finally {
        setIsSearching(false);
      }
    };

    const timer = window.setTimeout(() => void run(), 320);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  async function handleAdd(q: LeetCodeQuestion) {
    setAddingSlug(q.titleSlug);
    try {
      await onAdd(q);
    } finally {
      setAddingSlug(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="M14 14l4 4" strokeLinecap="round" />
        </svg>
        <Input
          id="add-question-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, topic, e.g. 'two sum'…"
          className="h-10 rounded-xl bg-zinc-950/80 pl-9 text-sm"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-400" />
          </div>
        )}
      </div>

      {searchError && (
        <p className="text-xs text-rose-400">{searchError}</p>
      )}

      {/* Results list */}
      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {results.map((q) => {
          const isAdded = existingSlugs.has(q.titleSlug);
          const isAdding = addingSlug === q.titleSlug;

          return (
            <div
              key={q.titleSlug}
              className="flex items-center gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/60 px-3 py-2.5 transition hover:border-zinc-700"
            >
              <div className="min-w-0 flex-1">
                <a
                  href={`https://leetcode.com/problems/${q.titleSlug}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-xs font-medium text-zinc-200 hover:text-cyan-300 transition-colors"
                  title={q.title}
                >
                  <span className="mr-1 text-zinc-600">#{q.frontendQuestionId}</span>
                  {q.title}
                </a>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant={difficultyVariant(q.difficulty)} className="text-[9px]">{q.difficulty}</Badge>
                  {q.topicTags.slice(0, 2).map((t) => (
                    <span key={t.slug} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-500">
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleAdd(q)}
                disabled={isAdded || isAdding}
                className={cn(
                  "shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition disabled:pointer-events-none",
                  isAdded
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/20",
                )}
              >
                {isAdding ? "…" : isAdded ? "✓ Added" : "+ Add"}
              </button>
            </div>
          );
        })}

        {!isSearching && results.length === 0 && !searchError && (
          <p className="py-4 text-center text-xs text-zinc-600">No results found.</p>
        )}
      </div>
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function Stat({ value, label, accent, sub }: { value: number | string; label: string; accent: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-5 text-center">
      <span className={cn("text-3xl font-bold tabular-nums leading-none", accent)}>{value}</span>
      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      {sub && <span className="text-[10px] text-zinc-700">{sub}</span>}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ReviewQueue() {
  const [schedule, setSchedule] = useState<ScheduledQuestion[]>([]);
  const [sm2States, setSm2States] = useState<Sm2Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [ratingInProgress, setRatingInProgress] = useState<string | null>(null);
  const [completed, setCompleted] = useState<CompletedEntry[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("due");
  const [filterQuery, setFilterQuery] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingItem, setEditingItem] = useState<MergedQuestion | null>(null);
  const [editWorking, setEditWorking] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const ratedTodaySlugs = useRef<Set<string>>(new Set());

  // ── Load data ─────────────────────────────────────────────────────────────

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [schedRes, sm2Res] = await Promise.all([
        fetch("/api/revision/schedule", { cache: "no-store", signal }),
        fetch("/api/sm2", { cache: "no-store", signal }),
      ]);

      const schedPayload = (await schedRes.json()) as ScheduleApiResponse;
      const sm2Payload = (await sm2Res.json()) as Sm2ApiResponse;

      if (!schedRes.ok) {
        setErrorMessage(schedPayload.error ?? "Could not load schedule.");
        return;
      }

      setSchedule(schedPayload.schedule ?? []);
      setSm2States(sm2Payload.states ?? []);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setErrorMessage("Could not load schedule data.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const c = new AbortController();
    void load(c.signal);
    return () => c.abort();
  }, [load]);

  // ── Toast ─────────────────────────────────────────────────────────────────

  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
  }

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  // ── Merge ─────────────────────────────────────────────────────────────────

  const merged: MergedQuestion[] = useMemo(() => {
    // Build a lookup of revision schedule entries by titleSlug for metadata
    const scheduleBySlug = new Map<string, ScheduledQuestion>();
    for (const entry of schedule) {
      if (!scheduleBySlug.has(entry.question.titleSlug)) {
        scheduleBySlug.set(entry.question.titleSlug, entry);
      }
    }

    // SOURCE OF TRUTH: only show questions that have an SM-2 record.
    // This means Clear All truly empties the queue, and newly added questions
    // only appear after initializeSm2State creates their record.
    const out: MergedQuestion[] = [];

    for (const rec of sm2States) {
      const entry = scheduleBySlug.get(rec.titleSlug);
      if (!entry) continue; // sm2 record without a schedule entry — skip

      out.push({
        scheduleId: entry.id,
        titleSlug: rec.titleSlug,
        title: entry.question.title,
        difficulty: entry.question.difficulty,
        acRate: entry.question.acRate,
        topicTags: entry.question.topicTags,
        sm2: rec,
        addedOn: entry.solvedOn,
      });
    }

    return out;
  }, [schedule, sm2States]);

  const existingSlugs = useMemo(() => new Set(merged.map((m) => m.titleSlug)), [merged]);

  // ── Filtered / partitioned lists ──────────────────────────────────────────

  const q = filterQuery.toLowerCase().trim();

  const dueItems = useMemo(
    () =>
      merged
        .filter(
          (item) =>
            !ratedTodaySlugs.current.has(item.titleSlug) &&
            isReviewDue(item.sm2, TODAY) &&
            (!q || item.title.toLowerCase().includes(q) || item.topicTags.some((t) => t.name.toLowerCase().includes(q))),
        )
        .sort((a, b) => daysOverdue(b.sm2, TODAY) - daysOverdue(a.sm2, TODAY)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [merged, completed, q],
  );

  const upcomingItems = useMemo(
    () =>
      merged
        .filter(
          (item) =>
            !isReviewDue(item.sm2, TODAY) &&
            (!q || item.title.toLowerCase().includes(q) || item.topicTags.some((t) => t.name.toLowerCase().includes(q))),
        )
        .sort((a, b) => (a.sm2?.nextReviewOn ?? "").localeCompare(b.sm2?.nextReviewOn ?? "")),
    [merged, q],
  );

  const allItems = useMemo(
    () =>
      merged.filter(
        (item) =>
          !q || item.title.toLowerCase().includes(q) || item.topicTags.some((t) => t.name.toLowerCase().includes(q)),
      ),
    [merged, q],
  );

  // ── Stats ─────────────────────────────────────────────────────────────────

  const avgStreak = useMemo(() => {
    const rated = sm2States.filter((s) => s.streak > 0);
    if (!rated.length) return 0;
    return (rated.reduce((a, s) => a + s.streak, 0) / rated.length).toFixed(1);
  }, [sm2States]);

  const mastered = sm2States.filter((s) => s.interval >= 14).length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleRate(item: MergedQuestion, rating: Sm2Rating) {
    setRatingInProgress(item.titleSlug);

    try {
      const res = await fetch("/api/sm2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleSlug: item.titleSlug, rating }),
      });

      const payload = (await res.json()) as Sm2ApiResponse;

      if (!res.ok || !payload.state) {
        showToast(payload.error ?? "Could not save rating.", "err");
        return;
      }

      const ns = payload.state;
      setSm2States((prev) => {
        const exists = prev.find((s) => s.titleSlug === item.titleSlug);
        return exists
          ? prev.map((s) => (s.titleSlug === item.titleSlug ? ns : s))
          : [ns, ...prev];
      });

      ratedTodaySlugs.current.add(item.titleSlug);
      setCompleted((prev) => [
        { titleSlug: item.titleSlug, title: item.title, rating, nextReviewOn: ns.nextReviewOn, streak: ns.streak },
        ...prev,
      ]);

      const msgs: Record<Sm2Rating, string> = {
        failed: "Reset — back tomorrow 💪",
        tookTime: "Scheduled! Keep grinding.",
        instant: "Interval extended ⚡",
      };
      showToast(msgs[rating]);
    } catch {
      showToast("Could not save rating.", "err");
    } finally {
      setRatingInProgress(null);
    }
  }

  async function handleAdd(question: LeetCodeQuestion) {
    if (existingSlugs.has(question.titleSlug)) {
      showToast("Already in your SM-2 queue.");
      return;
    }

    // 1. Add to revision schedule (for /calendar)
    const schedRes = await fetch("/api/revision/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const schedPayload = (await schedRes.json()) as ScheduleApiResponse;

    // 409 = already in revision schedule — that's fine, we still want to init SM-2
    if (!schedRes.ok && schedRes.status !== 409) {
      showToast(schedPayload.error ?? "Could not add question.", "err");
      return;
    }

    if (schedPayload.item) {
      setSchedule((prev) => [schedPayload.item as ScheduledQuestion, ...prev]);
    }

    // 2. Create the SM-2 record so it appears in the Due queue immediately
    const sm2Res = await fetch("/api/sm2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "initialize", titleSlug: question.titleSlug }),
    });

    const sm2Payload = (await sm2Res.json()) as Sm2ApiResponse;

    if (!sm2Res.ok || !sm2Payload.state) {
      showToast(sm2Payload.error ?? "Could not add to SM-2 queue.", "err");
      return;
    }

    setSm2States((prev) => {
      const exists = prev.find((s) => s.titleSlug === question.titleSlug);
      return exists ? prev : [sm2Payload.state!, ...prev];
    });

    showToast(`"${question.title}" added — due for first review today.`);
  }

  async function handleRemove(item: MergedQuestion) {
    setEditWorking(true);

    try {
      const res = await fetch("/api/revision/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-entry", id: item.scheduleId }),
      });

      const payload = (await res.json()) as ScheduleApiResponse;

      if (!res.ok || !payload.deleted) {
        showToast(payload.error ?? "Could not remove question.", "err");
        return;
      }

      setSchedule((prev) => prev.filter((e) => e.id !== item.scheduleId));
      setSm2States((prev) => prev.filter((s) => s.titleSlug !== item.titleSlug));
      setEditingItem(null);
      showToast(`"${item.title}" removed.`);
    } catch {
      showToast("Could not remove question.", "err");
    } finally {
      setEditWorking(false);
    }
  }

  async function handleResetSm2(item: MergedQuestion) {
    setEditWorking(true);

    try {
      // Reset by rating "failed" — brings streak/interval back to 0/1
      const res = await fetch("/api/sm2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleSlug: item.titleSlug, rating: "failed" }),
      });

      const payload = (await res.json()) as Sm2ApiResponse;

      if (!res.ok || !payload.state) {
        showToast(payload.error ?? "Could not reset SM-2 state.", "err");
        return;
      }

      setSm2States((prev) =>
        prev.map((s) => (s.titleSlug === item.titleSlug ? payload.state! : s)),
      );

      setEditingItem(null);
      showToast("SM-2 state reset to Day 1.");
    } catch {
      showToast("Could not reset SM-2 state.", "err");
    } finally {
      setEditWorking(false);
    }
  }

  async function handleClearAll() {
    setIsClearing(true);

    try {
      const res = await fetch("/api/sm2", { method: "DELETE" });
      const payload = (await res.json()) as { deletedCount?: number; error?: string };

      if (!res.ok) {
        showToast(payload.error ?? "Could not clear SM-2 data.", "err");
        return;
      }

      // Reset all local SM-2 state — revision schedule & /calendar untouched
      setSm2States([]);
      setCompleted([]);
      ratedTodaySlugs.current.clear();
      setShowClearConfirm(false);
      showToast(`Cleared ${payload.deletedCount ?? 0} SM-2 records. Calendar unaffected.`);
    } catch {
      showToast("Could not clear SM-2 data.", "err");
    } finally {
      setIsClearing(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const tabs: { key: ActiveTab; label: string; count: number }[] = [
    { key: "due", label: "Due / Overdue", count: dueItems.length },
    { key: "upcoming", label: "Upcoming", count: upcomingItems.length },
    { key: "all", label: "All Questions", count: allItems.length },
  ];

  return (
    <div className="mt-6 space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "pointer-events-none fixed right-6 top-6 z-50 animate-[fade-in_200ms_ease-out_both] rounded-xl border px-5 py-2.5 text-sm shadow-lg",
            toast.type === "err"
              ? "border-rose-400/50 bg-rose-500/15 text-rose-100 shadow-[0_12px_30px_-16px_rgba(239,68,68,0.7)]"
              : "border-cyan-400/50 bg-cyan-500/15 text-cyan-100 shadow-[0_12px_30px_-16px_rgba(6,182,212,0.8)]",
          )}
        >
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={dueItems.length} label="Due today" accent="text-rose-300" />
        <Stat value={merged.length} label="Tracked" accent="text-zinc-200" />
        <Stat value={avgStreak} label="Avg streak" accent="text-amber-300" />
        <Stat value={mastered} label="Mastered" accent="text-emerald-300" sub="interval ≥ 14d" />
      </div>

      {/* Toolbar: search + Add + Clear All */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4" strokeLinecap="round" />
          </svg>
          <Input
            id="queue-filter"
            type="search"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter queue by name or topic…"
            className="h-10 rounded-xl bg-zinc-950/80 pl-9"
          />
        </div>
        <Button
          onClick={() => setShowAddPanel((v) => !v)}
          className={cn(
            "h-10 gap-2 rounded-xl px-4 transition-all",
            showAddPanel && "bg-cyan-400/25 border-cyan-300",
          )}
        >
          <span className="text-base leading-none">{showAddPanel ? "✕" : "+"}</span>
          Add Problem
        </Button>
        {sm2States.length > 0 && (
          <Button
            variant="danger"
            onClick={() => setShowClearConfirm(true)}
            className="h-10 rounded-xl px-4"
            title="Clear all SM-2 data (calendar unaffected)"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Add questions panel */}
      {showAddPanel && (
        <Card className="border-cyan-500/25 bg-zinc-900/80">
          <CardContent className="p-5">
            <p className="mb-3 text-sm font-semibold text-zinc-200">
              Search & add a solved problem to your SM-2 queue
            </p>
            <AddQuestionsPanel onAdd={handleAdd} existingSlugs={existingSlugs} />
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {errorMessage && (
        <Card className="border-rose-500/40 bg-rose-500/10">
          <CardContent className="p-4 text-sm text-rose-200">{errorMessage}</CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 px-5 py-6 text-sm text-zinc-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-400" />
          Loading your review queue…
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !errorMessage && merged.length === 0 && (
        <Card className="border-zinc-800/60">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <p className="text-4xl">📭</p>
            <p className="mt-3 text-base font-semibold text-zinc-300">Nothing in your queue yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              Click <span className="font-medium text-cyan-400">+ Add Problem</span> above to add solved questions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      {!isLoading && merged.length > 0 && (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-950/50 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  activeTab === tab.key
                    ? "bg-zinc-800 text-zinc-100 shadow"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "min-w-[20px] rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    activeTab === tab.key
                      ? tab.key === "due"
                        ? "bg-rose-500/25 text-rose-300"
                        : "bg-zinc-700 text-zinc-300"
                      : "bg-zinc-800/60 text-zinc-600",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ── Due tab ── */}
          {activeTab === "due" && (
            <div className="space-y-5">
              {dueItems.length === 0 && completed.length === 0 && (
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="flex flex-col items-center py-14 text-center">
                    <p className="text-4xl">🎉</p>
                    <p className="mt-3 text-base font-semibold text-emerald-300">All caught up!</p>
                    <p className="mt-1 text-sm text-zinc-500">No reviews due. Check back tomorrow.</p>
                  </CardContent>
                </Card>
              )}

              {dueItems.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {dueItems.length} to review
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {dueItems.map((item) => (
                      <DueCard
                        key={item.titleSlug}
                        item={item}
                        isRating={ratingInProgress === item.titleSlug}
                        onRate={(r) => void handleRate(item, r)}
                        onEdit={() => setEditingItem(item)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed today */}
              {completed.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Reviewed today ({completed.length})
                  </p>
                  <div className="space-y-1.5">
                    {completed.map((entry) => (
                      <div
                        key={entry.titleSlug}
                        className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/50 bg-zinc-950/40 px-4 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <a
                            href={`https://leetcode.com/problems/${entry.titleSlug}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-sm font-medium text-zinc-300 hover:text-cyan-300 transition-colors"
                          >
                            {entry.title}
                          </a>
                          <p className="mt-0.5 text-[10px] text-zinc-600">
                            Next: {formatRelativeDate(entry.nextReviewOn)} · Streak {entry.streak}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-xs font-semibold",
                            entry.rating === "failed"
                              ? "text-rose-300"
                              : entry.rating === "tookTime"
                              ? "text-amber-300"
                              : "text-emerald-300",
                          )}
                        >
                          {ratingMeta(entry.rating).icon} {ratingMeta(entry.rating).label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Upcoming tab ── */}
          {activeTab === "upcoming" && (
            <div className="space-y-2">
              {upcomingItems.length === 0 ? (
                <Card className="border-zinc-800/60">
                  <CardContent className="py-8 text-center text-sm text-zinc-400">
                    No upcoming reviews yet. Rate due questions first.
                  </CardContent>
                </Card>
              ) : (
                upcomingItems.map((item) => (
                  <QueueRow
                    key={item.titleSlug}
                    item={item}
                    showRating={false}
                    isRating={ratingInProgress === item.titleSlug}
                    onRate={(r) => void handleRate(item, r)}
                    onEdit={() => setEditingItem(item)}
                  />
                ))
              )}
            </div>
          )}

          {/* ── All tab ── */}
          {activeTab === "all" && (
            <div className="space-y-2">
              {allItems.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500">No questions match your filter.</p>
              ) : (
                allItems.map((item) => (
                  <QueueRow
                    key={item.titleSlug}
                    item={item}
                    showRating={isReviewDue(item.sm2, TODAY)}
                    isRating={ratingInProgress === item.titleSlug}
                    onRate={(r) => void handleRate(item, r)}
                    onEdit={() => setEditingItem(item)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      <EditModal
        item={editingItem}
        open={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onRemove={() => editingItem && void handleRemove(editingItem)}
        onResetSm2={() => editingItem && void handleResetSm2(editingItem)}
        isWorking={editWorking}
      />

      {/* Clear All confirmation dialog */}
      <Dialog open={showClearConfirm} onOpenChange={(o) => !o && setShowClearConfirm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all SM-2 data?</DialogTitle>
            <DialogDescription>
              This will reset every streak and interval in your Review Schedule — your questions will reappear as
              &ldquo;First review&rdquo; next time. Your{" "}
              <span className="font-semibold text-zinc-200">/calendar</span> and revision schedule are{" "}
              <span className="font-semibold text-emerald-400">not affected</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost" size="sm" disabled={isClearing}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="danger"
              size="sm"
              onClick={() => void handleClearAll()}
              disabled={isClearing}
            >
              {isClearing ? "Clearing…" : "Yes, clear all SM-2 data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
