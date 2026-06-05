import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { ReviewQueue } from "@/app/schedule/review-queue";
import { SignOutButton } from "@/app/dashboard/sign-out-button";

export const metadata: Metadata = {
  title: "SM-2 Review Schedule | LeetRevise",
  description:
    "Daily spaced-repetition review queue powered by a custom SM-2 algorithm tailored for a 30-day placement sprint.",
  robots: { index: false, follow: false },
};

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06090f] text-zinc-100">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_0%,rgba(6,182,212,0.18),transparent_40%),radial-gradient(ellipse_at_85%_10%,rgba(16,185,129,0.13),transparent_38%),radial-gradient(ellipse_at_50%_100%,rgba(245,158,11,0.09),transparent_42%)]" />

      <main className="relative mx-auto w-full max-w-5xl px-5 py-8 sm:px-10">

        {/* ── Top nav bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Brand + breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3.5 py-1.5 text-xs font-medium text-cyan-300 transition hover:border-cyan-400/50"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              LeetRevise
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="text-sm font-medium text-zinc-300">Review Schedule</span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800/70"
            >
              Dashboard
            </Link>
            <Link
              href="/calendar"
              className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800/70"
            >
              Calendar
            </Link>
            <SignOutButton />
          </div>
        </div>

        {/* ── Hero heading ── */}
        <div className="mt-10 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            SM-2 Engine · 30-Day Sprint
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Review Schedule
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400">
            Rate each problem honestly. The algorithm sets the next review date automatically.
          </p>
        </div>

        {/* ── Rating legend ── */}
        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/6 px-4 py-3">
            <span className="mt-0.5 text-lg leading-none">✕</span>
            <div>
              <p className="text-xs font-semibold text-rose-300">Failed</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                Streak resets. You see it again tomorrow.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/6 px-4 py-3">
            <span className="mt-0.5 text-lg leading-none">⏱</span>
            <div>
              <p className="text-xs font-semibold text-amber-300">Took Time</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                Interval × 1.5 (streak ≥ 3) or fixed 2–4d steps.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/6 px-4 py-3">
            <span className="mt-0.5 text-lg leading-none">⚡</span>
            <div>
              <p className="text-xs font-semibold text-emerald-300">Instant</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                Interval × 2.0 (streak ≥ 3). Capped at 30 days.
              </p>
            </div>
          </div>
        </div>

        {/* ── Review Queue ── */}
        <ReviewQueue />
      </main>
    </div>
  );
}
