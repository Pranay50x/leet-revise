import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import type { LeetCodeQuestion } from "@/lib/leetcode";
import {
  createScheduleForUser,
  deleteScheduleForUser,
  incrementDoneCount,
  listSchedulesForUser,
  updateScheduleForUser,
} from "@/lib/revision-schedule-store";
import { authOptions } from "@/lib/auth-options";

type AddSchedulePayload = {
  question?: LeetCodeQuestion;
};

type UpdateSchedulePayload = {
  action?: "increment-done" | "update-entry" | "delete-entry";
  id?: string;
  dateKey?: string;
  reviewDates?: string[];
  completedReviewCounts?: Record<string, unknown>;
};

function isValidQuestion(input: unknown): input is LeetCodeQuestion {
  if (!input || typeof input !== "object") {
    return false;
  }

  const candidate = input as Partial<LeetCodeQuestion>;
  return (
    typeof candidate.title === "string" &&
    typeof candidate.titleSlug === "string" &&
    typeof candidate.frontendQuestionId === "string" &&
    typeof candidate.difficulty === "string" &&
    typeof candidate.acRate === "number" &&
    typeof candidate.paidOnly === "boolean" &&
    Array.isArray(candidate.topicTags)
  );
}

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const schedule = await listSchedulesForUser(userId);
    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Failed to list schedule:", error);
    return NextResponse.json({ error: "Failed to load schedule." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: AddSchedulePayload;

  try {
    body = (await request.json()) as AddSchedulePayload;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  if (!isValidQuestion(body.question)) {
    return NextResponse.json({ error: "Invalid question payload." }, { status: 400 });
  }

  try {
    const item = await createScheduleForUser(userId, body.question);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error) {
      const candidate = error as { code?: number };
      if (candidate.code === 11000) {
        return NextResponse.json({ error: "Question already exists in schedule." }, { status: 409 });
      }
    }

    console.error("Failed to create schedule item:", error);
    return NextResponse.json({ error: "Failed to create schedule item." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: UpdateSchedulePayload;

  try {
    body = (await request.json()) as UpdateSchedulePayload;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  if (!body.id || typeof body.id !== "string") {
    return NextResponse.json({ error: "Missing schedule id." }, { status: 400 });
  }

  try {
    if (body.action === "increment-done") {
      if (!body.dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(body.dateKey)) {
        return NextResponse.json({ error: "Invalid date key." }, { status: 400 });
      }

      const item = await incrementDoneCount(userId, body.id, body.dateKey);

      if (!item) {
        return NextResponse.json({ error: "Schedule item not found." }, { status: 404 });
      }

      return NextResponse.json({ item });
    }

    if (body.action === "delete-entry") {
      const deleted = await deleteScheduleForUser(userId, body.id);
      return NextResponse.json({ deleted });
    }

    if (body.action === "update-entry") {
      if (!Array.isArray(body.reviewDates)) {
        return NextResponse.json({ error: "reviewDates must be an array." }, { status: 400 });
      }

      const item = await updateScheduleForUser(userId, body.id, {
        reviewDates: body.reviewDates,
        completedReviewCounts: body.completedReviewCounts,
      });

      if (!item) {
        return NextResponse.json({ error: "Schedule item not found." }, { status: 404 });
      }

      return NextResponse.json({ item });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    console.error("Failed to update schedule:", error);
    return NextResponse.json({ error: "Failed to update schedule." }, { status: 500 });
  }
}