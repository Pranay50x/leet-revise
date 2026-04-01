import Link from "next/link";

export default function Home() {
  const cardAnimationClasses = [
    "animate-[rise-in_650ms_ease-out_220ms_both]",
    "animate-[rise-in_650ms_ease-out_310ms_both]",
    "animate-[rise-in_650ms_ease-out_400ms_both]",
  ] as const;

  const highlights = [
    {
      title: "Question Capture",
      description:
        "Save LeetCode problems with tags, patterns, and your own notes in under 20 seconds.",
    },
    {
      title: "Adaptive Intervals",
      description:
        "Get the next revision date based on recall quality so hard problems surface sooner.",
    },
    {
      title: "Retention Dashboard",
      description:
        "Track due cards, streaks, and weak patterns before interviews catch you off guard.",
    },
  ] as const;

  const steps = [
    "Add a solved question with key approach and pitfalls.",
    "Revise in short daily sessions with smart due queues.",
    "Mark recall quality and let intervals auto-adjust.",
  ] as const;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06090f] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.14),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(245,158,11,0.12),transparent_38%)]" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-8 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between animate-[fade-in_700ms_ease-out_both]">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/30 bg-cyan-400/8 px-4 py-2 text-sm font-medium tracking-wide text-cyan-200">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            LeetRevise
          </div>
          <Link
            className="rounded-full border border-zinc-700/90 px-5 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800/50"
            href="/login"
          >
            Sign in
          </Link>
        </header>

        <section className="grid items-start gap-12 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-8 animate-[rise-in_700ms_ease-out_both]">
            <p className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Spaced repetition for DSA prep
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Stop forgetting solved LeetCode questions.
            </h1>
            <p className="max-w-xl text-base leading-8 text-zinc-300 sm:text-lg">
              Build a long-term memory system for coding interviews. Add questions,
              review on schedule, and strengthen weak patterns before they fade.
            </p>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link
                className="rounded-xl bg-cyan-400 px-6 py-3 text-center text-sm font-semibold text-zinc-950 transition hover:bg-cyan-300"
                href="/register"
              >
                Start revising
              </Link>
              <a
                className="rounded-xl border border-zinc-600 px-6 py-3 text-center text-sm font-semibold text-zinc-100 transition hover:border-zinc-400 hover:bg-zinc-800/50"
                href="#how-it-works"
              >
                Explore workflow
              </a>
            </div>

            <p className="text-sm text-zinc-400">
              Already have an account?{" "}
              <Link className="font-medium text-cyan-300 hover:text-cyan-200" href="/login">
                Sign in
              </Link>
              {" | "}
              <Link className="font-medium text-emerald-300 hover:text-emerald-200" href="/dashboard">
                Go to dashboard
              </Link>
            </p>
          </div>

          <aside className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-[0_30px_90px_-40px_rgba(6,182,212,0.65)] animate-[rise-in_700ms_ease-out_140ms_both]">
            <p className="text-sm font-medium text-zinc-400">Today&apos;s Queue</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Due now</p>
                <p className="mt-2 text-2xl font-semibold text-cyan-300">17</p>
              </article>
              <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Retention</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-300">84%</p>
              </article>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-zinc-800 bg-[#101725] p-4">
              <p className="text-sm font-medium text-zinc-200">Upcoming reviews</p>
              <div className="space-y-2 text-sm text-zinc-300">
                <div className="flex items-center justify-between rounded-lg bg-zinc-800/70 px-3 py-2">
                  <span>Binary Search on Answer</span>
                  <span className="text-cyan-300">2h</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-zinc-800/70 px-3 py-2">
                  <span>Sliding Window Max</span>
                  <span className="text-cyan-300">Tomorrow</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-zinc-800/70 px-3 py-2">
                  <span>DP: Coin Change 2</span>
                  <span className="text-cyan-300">3d</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item, index) => (
            <article
              key={item.title}
              className={`rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 ${cardAnimationClasses[index]}`}
            >
              <h2 className="text-lg font-semibold text-zinc-100">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">{item.description}</p>
            </article>
          ))}
        </section>

        <section
          id="how-it-works"
          className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 animate-[fade-in_900ms_ease-out_320ms_both]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
            How it works
          </p>
          <ol className="mt-4 grid gap-3 text-sm text-zinc-300 sm:text-base">
            {steps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3"
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-200">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
