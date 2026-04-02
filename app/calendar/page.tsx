import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getServerSession } from "next-auth";

import { RevisionCalendar } from "@/app/calendar/revision-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/app/dashboard/sign-out-button";
import { authOptions } from "@/lib/auth-options";

export const metadata: Metadata = {
  title: "Revision Calendar",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06090f] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(6,182,212,0.15),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(245,158,11,0.1),transparent_40%)]" />

      <main className="relative mx-auto w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-16">
        <Card className="bg-zinc-900/60">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Revision Calendar</p>
            <CardTitle className="mt-2 text-2xl text-white sm:text-3xl">
              Month View for {session.user?.name ?? "Coder"}
            </CardTitle>
            <CardDescription className="mt-2 text-sm">Plan and complete revision sessions across the month.</CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard"><Button>Search Dashboard</Button></Link>
            <Link href="/"><Button variant="outline">Home</Button></Link>
            <SignOutButton />
          </div>
          </CardHeader>
        </Card>

        <RevisionCalendar />
      </main>
    </div>
  );
}