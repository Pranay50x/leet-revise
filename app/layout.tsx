import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LeetRevise | LeetCode Spaced Repetition for Interview Prep",
    template: "%s | LeetRevise",
  },
  description:
    "LeetRevise helps you remember solved LeetCode questions using spaced repetition, adaptive revision intervals, and a focused interview prep workflow.",
  applicationName: "LeetRevise",
  keywords: [
    "leetcode revision",
    "spaced repetition leetcode",
    "leetcode spaced repetition",
    "coding interview prep",
    "dsa revision",
    "algorithm revision",
    "retain leetcode problems",
    "interview preparation",
    "leetcode tracker",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LeetRevise | LeetCode Spaced Repetition for Interview Prep",
    description:
      "Track solved LeetCode questions, revise with adaptive intervals, and improve long-term recall for coding interviews.",
    url: "/",
    siteName: "LeetRevise",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "LeetRevise | LeetCode Spaced Repetition",
    description:
      "Build long-term memory for LeetCode with spaced repetition and a revision calendar.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-mono">
        <Analytics />
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-800 bg-[#06090f] px-6 py-4 text-sm text-zinc-400">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Made by{" "}
                <a
                  href="https://pranay50x.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  Pranay50X
                </a>
              </p>
              <p>
                Source code:{" "}
                <a
                  href="https://github.com/Pranay50x/leet-revise/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  github.com/Pranay50x/leet-revise
                </a>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
