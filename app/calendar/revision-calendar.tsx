"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  sortAndDedupeDateKeys,
  toDateKey,
  type ScheduledQuestion,
} from "@/lib/revision-schedule";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type ScheduleApiResponse = {
  schedule?: ScheduledQuestion[];
  item?: ScheduledQuestion;
  deleted?: boolean;
  error?: string;
};

function getDifficultyVariant(difficulty: ScheduledQuestion["question"]["difficulty"]): "easy" | "medium" | "hard" | "default" {
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

function getMonthTitle(monthDate: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(monthDate);
}

function getMonthGrid(monthDate: Date): Array<string | null> {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prefixEmptyCells = firstDay.getDay();

  const cells: Array<string | null> = Array.from({ length: prefixEmptyCells }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toDateKey(new Date(year, month, day)));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function getDayLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  return String(date.getDate());
}

function isToday(dateKey: string): boolean {
  return dateKey === toDateKey(new Date());
}

export function RevisionCalendar() {
  const [schedule, setSchedule] = useState<ScheduledQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draftReviewDates, setDraftReviewDates] = useState<string[]>([]);
  const [draftCounts, setDraftCounts] = useState<Record<string, number>>({});
  const editingItem = useMemo(
    () => schedule.find((item) => item.id === editingItemId) ?? null,
    [editingItemId, schedule],
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadSchedule = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch("/api/revision/schedule", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = (await response.json()) as ScheduleApiResponse;

        if (!response.ok) {
          setErrorMessage(payload.error ?? "Could not load revision calendar.");
          return;
        }

        setSchedule(payload.schedule ?? []);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setErrorMessage("Could not load revision calendar.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSchedule();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const monthTitle = useMemo(() => getMonthTitle(currentMonth), [currentMonth]);
  const monthCells = useMemo(() => getMonthGrid(currentMonth), [currentMonth]);

  const itemsByDate = useMemo(() => {
    const buckets = new Map<string, ScheduledQuestion[]>();

    for (const entry of schedule) {
      for (const date of entry.reviewDates) {
        const existing = buckets.get(date) ?? [];
        existing.push(entry);
        buckets.set(date, existing);
      }
    }

    return buckets;
  }, [schedule]);

  function goToPreviousMonth(): void {
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }

  function goToNextMonth(): void {
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  function goToCurrentMonth(): void {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  function patchItemInState(item: ScheduledQuestion): void {
    setSchedule((current) => current.map((entry) => (entry.id === item.id ? item : entry)));
  }

  function openEditModal(item: ScheduledQuestion): void {
    setEditingItemId(item.id);
    setDraftReviewDates([...item.reviewDates]);
    setDraftCounts(item.completedReviewCounts ?? {});
  }

  function closeEditModal(): void {
    setEditingItemId(null);
    setDraftReviewDates([]);
    setDraftCounts({});
  }

  function addDraftReviewDate(): void {
    setDraftReviewDates((current) => sortAndDedupeDateKeys([...current, toDateKey(new Date())]));
  }

  function removeDraftReviewDate(dateKey: string): void {
    setDraftReviewDates((current) => current.filter((date) => date !== dateKey));
  }

  function updateDraftDate(previousDateKey: string, nextDateKey: string): void {
    setDraftReviewDates((current) =>
      sortAndDedupeDateKeys(current.map((date) => (date === previousDateKey ? nextDateKey : date))),
    );
  }

  function updateDraftCount(dateKey: string, value: number): void {
    setDraftCounts((current) => ({
      ...current,
      [dateKey]: Math.max(0, Math.floor(value)),
    }));
  }

  async function markRevisionDone(entryId: string, dateKey: string): Promise<void> {
    try {
      const response = await fetch("/api/revision/schedule", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "increment-done",
          id: entryId,
          dateKey,
        }),
      });

      const payload = (await response.json()) as ScheduleApiResponse;

      if (!response.ok || !payload.item) {
        setToastMessage(payload.error ?? "Could not update completion count.");
        return;
      }

      patchItemInState(payload.item);
      setToastMessage("Revision count updated.");
    } catch {
      setToastMessage("Could not update completion count.");
    }
  }

  async function saveEntryEdits(): Promise<void> {
    if (!editingItemId) {
      return;
    }

    try {
      const response = await fetch("/api/revision/schedule", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update-entry",
          id: editingItemId,
          reviewDates: draftReviewDates,
          completedReviewCounts: draftCounts,
        }),
      });

      const payload = (await response.json()) as ScheduleApiResponse;

      if (!response.ok || !payload.item) {
        setToastMessage(payload.error ?? "Could not save changes.");
        return;
      }

      patchItemInState(payload.item);
      closeEditModal();
      setToastMessage("Calendar entry saved.");
    } catch {
      setToastMessage("Could not save changes.");
    }
  }

  async function deleteEntry(entryId: string): Promise<void> {
    try {
      const response = await fetch("/api/revision/schedule", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "delete-entry", id: entryId }),
      });

      const payload = (await response.json()) as ScheduleApiResponse;

      if (!response.ok || !payload.deleted) {
        setToastMessage(payload.error ?? "Could not delete entry.");
        return;
      }

      setSchedule((current) => current.filter((item) => item.id !== entryId));
      closeEditModal();
      setToastMessage("Calendar entry removed.");
    } catch {
      setToastMessage("Could not delete entry.");
    }
  }

  const totalReviewsThisMonth = useMemo(
    () =>
      monthCells.reduce((total, dateKey) => {
        if (!dateKey) {
          return total;
        }

        return total + (itemsByDate.get(dateKey)?.length ?? 0);
      }, 0),
    [itemsByDate, monthCells],
  );

  return (
    <section className="mt-8 space-y-5">
      {toastMessage ? (
        <div className="pointer-events-none fixed right-6 top-6 z-50 animate-[fade-in_200ms_ease-out_both] rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-100 shadow-[0_12px_30px_-16px_rgba(6,182,212,0.8)]">
          {toastMessage}
        </div>
      ) : null}

      <Card className="bg-linear-to-br from-zinc-900/85 via-zinc-900/70 to-cyan-950/25 shadow-[0_24px_90px_-50px_rgba(6,182,212,0.6)]">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl text-white">{monthTitle}</CardTitle>
              <CardDescription className="mt-1">
                {totalReviewsThisMonth} planned revisions this month
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={goToPreviousMonth}>Prev</Button>
              <Button onClick={goToCurrentMonth}>Today</Button>
              <Button variant="outline" onClick={goToNextMonth}>Next</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="easy">Easy</Badge>
            <Badge variant="medium">Medium</Badge>
            <Badge variant="hard">Hard</Badge>
          </div>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Card className="border-rose-500/40 bg-rose-500/10">
          <CardContent className="p-4 text-sm text-rose-200">{errorMessage}</CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="p-4 text-sm text-zinc-400">Loading calendar...</CardContent>
        </Card>
      ) : null}

      <Card className="bg-zinc-900/65">
        <CardContent className="p-3 sm:p-4">
          <div className="overflow-x-auto">
            <div className="grid min-w-245 grid-cols-7 gap-2">
          {WEEKDAY_LABELS.map((weekday) => (
            <p key={weekday} className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {weekday}
            </p>
          ))}

          {monthCells.map((dateKey, index) => {
            if (!dateKey) {
              return <div key={`empty-${index}`} className="min-h-28 rounded-lg border border-transparent" />;
            }

            const items = itemsByDate.get(dateKey) ?? [];

            return (
              <div
                key={dateKey}
                className={cn(
                  "h-52 rounded-xl border bg-zinc-950/70 p-2",
                  isToday(dateKey) ? "border-cyan-400/55 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]" : "border-zinc-800",
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-200">{getDayLabel(dateKey)}</p>
                  <Badge className="px-1.5 py-0 text-[10px]" variant="default">
                    {items.length} due
                  </Badge>
                </div>

                <div className="h-[calc(100%-28px)] space-y-1.5 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={`${dateKey}-${item.id}`} className="rounded-md border border-zinc-700 bg-zinc-900/70 px-2 py-1.5">
                      <a
                        href={`https://leetcode.com/problems/${item.question.titleSlug}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-[11px] font-medium text-zinc-100 hover:text-cyan-300"
                        title={item.question.title}
                      >
                        {item.question.title}
                      </a>
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <Badge className="px-1.5 py-0 text-[9px]" variant={getDifficultyVariant(item.question.difficulty)}>
                          {item.question.difficulty}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-zinc-500">
                            x{item.completedReviewCounts?.[dateKey] ?? 0}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void markRevisionDone(item.id, dateKey)}
                            className="h-5 px-1.5 text-[9px]"
                          >
                            Done +1
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openEditModal(item)}
                            className="h-5 px-1.5 text-[9px]"
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingItemId)} onOpenChange={(open) => (!open ? closeEditModal() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Calendar Entry</DialogTitle>
            <DialogDescription>
              {editingItem ? editingItem.question.title : "Manage review dates and completion counts."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[52vh] space-y-3 overflow-y-auto pr-1">
            {draftReviewDates.map((dateKey) => (
              <div key={dateKey} className="grid grid-cols-[1fr_90px_auto] items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
                <Input
                  type="date"
                  value={dateKey}
                  onChange={(event) => updateDraftDate(dateKey, event.target.value)}
                  aria-label="Review date"
                />
                <Input
                  type="number"
                  min={0}
                  value={draftCounts[dateKey] ?? 0}
                  onChange={(event) => updateDraftCount(dateKey, Number(event.target.value))}
                  aria-label="Completion count"
                />
                <Button variant="danger" size="sm" onClick={() => removeDraftReviewDate(dateKey)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <Button variant="outline" onClick={addDraftReviewDate}>Add review date</Button>
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                onClick={() => (editingItemId ? void deleteEntry(editingItemId) : undefined)}
              >
                Delete entry
              </Button>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={() => void saveEntryEdits()}>Save changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}