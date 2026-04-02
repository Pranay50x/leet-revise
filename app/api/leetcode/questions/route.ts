import { NextResponse } from "next/server";

import { fetchLeetCodeQuestions } from "@/lib/leetcode";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

function parseLimit(rawLimit: string | null): number {
  if (!rawLimit) {
    return DEFAULT_LIMIT;
  }

  const parsedLimit = Number.parseInt(rawLimit, 10);

  if (Number.isNaN(parsedLimit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const limit = parseLimit(searchParams.get("limit"));

  try {
    const questions = await fetchLeetCodeQuestions({ query, limit });

    return NextResponse.json(
      {
        questions,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch LeetCode questions:", error);

    return NextResponse.json(
      {
        error: "Unable to fetch LeetCode questions right now.",
      },
      { status: 502 },
    );
  }
}