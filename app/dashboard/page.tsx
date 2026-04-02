import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "next-auth";

import { QuestionSearch } from "@/app/dashboard/question-search";
import { SignOutButton } from "@/app/dashboard/sign-out-button";
import { authOptions } from "@/lib/auth-options";

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
              Find questions fast and keep your revision list up to date.
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

        <QuestionSearch />
      </main>
    </div>
  );
}
