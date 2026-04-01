import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "next-auth";

import { SignOutButton } from "@/app/dashboard/sign-out-button";
import { authOptions } from "@/lib/auth-options";

const reviewStats = [
  { label: "Due today", value: "17", accent: "text-cyan-300" },
  { label: "Revision streak", value: "14d", accent: "text-emerald-300" },
  { label: "Retention score", value: "84%", accent: "text-amber-300" },
] as const;

const upcomingQueue = [
  { title: "Binary Search on Answer", due: "2h", difficulty: "Medium" },
  { title: "Sliding Window Max", due: "Today", difficulty: "Hard" },
  { title: "Coin Change II", due: "Tomorrow", difficulty: "Medium" },
  { title: "Longest Increasing Subsequence", due: "2d", difficulty: "Hard" },
] as const;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06090f] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(6,182,212,0.15),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(245,158,11,0.1),transparent_40%)]" />

      <main className="relative mx-auto w-full max-w-6xl px-6 py-8 sm:px-10 lg:px-16">
        <header className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              Welcome, {session.user?.name ?? "Coder"}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Stay consistent and revise before forgetting patterns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Home
            </Link>
            <SignOutButton />
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {reviewStats.map((item) => (
            <article key={item.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">{item.label}</p>
              <p className={`mt-3 text-3xl font-semibold ${item.accent}`}>{item.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-100">Upcoming review queue</h2>
              <button className="rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-cyan-300">
                Add question
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {upcomingQueue.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{item.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">Difficulty: {item.difficulty}</p>
                  </div>
                  <p className="text-sm font-semibold text-cyan-300">{item.due}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Focus areas</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="text-sm text-zinc-300">Dynamic Programming</p>
                <div className="mt-2 h-2 rounded-full bg-zinc-800">
                  <div className="h-2 w-[68%] rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="text-sm text-zinc-300">Graphs</p>
                <div className="mt-2 h-2 rounded-full bg-zinc-800">
                  <div className="h-2 w-[42%] rounded-full bg-amber-400" />
                </div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="text-sm text-zinc-300">Binary Search</p>
                <div className="mt-2 h-2 rounded-full bg-zinc-800">
                  <div className="h-2 w-[78%] rounded-full bg-cyan-400" />
                </div>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
