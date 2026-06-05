import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { applySm2Rating, clearAllSm2StatesForUser, initializeSm2State, listSm2StatesForUser } from "@/lib/sm2-store";
import type { Sm2Rating } from "@/lib/sm2-engine";

// ─── Types ───────────────────────────────────────────────────────────────────

type PostPayload = {
  action?: "rate" | "initialize";
  titleSlug?: string;
  rating?: string;
};

const VALID_RATINGS: Sm2Rating[] = ["failed", "tookTime", "instant"];

function isValidRating(value: unknown): value is Sm2Rating {
  return typeof value === "string" && (VALID_RATINGS as string[]).includes(value);
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * GET /api/sm2
 * Returns all SM-2 states for the authenticated user.
 */
export async function GET() {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const states = await listSm2StatesForUser(userId);
    return NextResponse.json({ states });
  } catch (error) {
    console.error("Failed to list SM-2 states:", error);
    return NextResponse.json({ error: "Failed to load SM-2 states." }, { status: 500 });
  }
}

/**
 * DELETE /api/sm2
 * Wipes all SM-2 state records for the authenticated user.
 * Does NOT touch the revision_schedules collection — /calendar is unaffected.
 */
export async function DELETE() {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const deletedCount = await clearAllSm2StatesForUser(userId);
    return NextResponse.json({ deletedCount });
  } catch (error) {
    console.error("Failed to clear SM-2 states:", error);
    return NextResponse.json({ error: "Failed to clear SM-2 states." }, { status: 500 });
  }
}

/**
 * POST /api/sm2
 * Body: { titleSlug: string, rating: "failed" | "tookTime" | "instant" }
 * Applies the SM-2 algorithm and upserts the state for that question.
 */
export async function POST(request: Request) {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: PostPayload;

  try {
    body = (await request.json()) as PostPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  if (!body.titleSlug || typeof body.titleSlug !== "string" || !body.titleSlug.trim()) {
    return NextResponse.json({ error: "titleSlug is required." }, { status: 400 });
  }

  const slug = body.titleSlug.trim();

  // ── Initialize (no rating needed) ─────────────────────────────────────────
  if (body.action === "initialize") {
    try {
      const state = await initializeSm2State(userId, slug);
      return NextResponse.json({ state });
    } catch (error) {
      console.error("Failed to initialize SM-2 state:", error);
      return NextResponse.json({ error: "Failed to initialize SM-2 state." }, { status: 500 });
    }
  }

  // ── Rate ──────────────────────────────────────────────────────────────────
  if (!isValidRating(body.rating)) {
    return NextResponse.json(
      { error: `rating must be one of: ${VALID_RATINGS.join(", ")}.` },
      { status: 400 },
    );
  }

  try {
    const state = await applySm2Rating(userId, slug, body.rating);
    return NextResponse.json({ state });
  } catch (error) {
    console.error("Failed to apply SM-2 rating:", error);
    return NextResponse.json({ error: "Failed to apply SM-2 rating." }, { status: 500 });
  }
}
