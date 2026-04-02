import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeetRevise",
  description:
    "Spaced repetition platform for LeetCode questions and coding interview prep.",
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
      <Analytics />
      <body className="min-h-full font-mono">
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
