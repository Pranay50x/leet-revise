/**
 * SM-2 State Store
 *
 * Manages a separate MongoDB collection (`sm2_states`) for persisting per-user,
 * per-question SM-2 review state. Completely independent of the existing
 * `revision_schedules` collection — linked only by `titleSlug`.
 */

import { Collection, ObjectId, WithId } from "mongodb";

import { getDatabase } from "@/lib/mongodb";
import { computeNextSm2State, type Sm2Rating, type Sm2State } from "@/lib/sm2-engine";

// ─── Types ───────────────────────────────────────────────────────────────────

type Sm2StateRecord = {
  userId: ObjectId;
  /** Matches `LeetCodeQuestion.titleSlug` from the revision schedule. */
  titleSlug: string;
  streak: number;
  interval: number;
  /** ISO date string "YYYY-MM-DD" */
  lastRatedOn: string | null;
  /** ISO date string "YYYY-MM-DD" */
  nextReviewOn: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Sm2Record = {
  id: string;
  titleSlug: string;
  streak: number;
  interval: number;
  lastRatedOn: string | null;
  nextReviewOn: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Collection helpers ───────────────────────────────────────────────────────

const COLLECTION = "sm2_states";
let indexesReady = false;

async function getCollection(): Promise<Collection<Sm2StateRecord>> {
  const db = await getDatabase();
  return db.collection<Sm2StateRecord>(COLLECTION);
}

async function ensureIndexes(): Promise<void> {
  if (indexesReady) return;

  const collection = await getCollection();
  await collection.createIndex({ userId: 1, titleSlug: 1 }, { unique: true });
  await collection.createIndex({ userId: 1, nextReviewOn: 1 });
  indexesReady = true;
}

function asObjectId(value: string): ObjectId {
  if (!ObjectId.isValid(value)) {
    throw new Error("Invalid ObjectId.");
  }
  return new ObjectId(value);
}

function serialize(doc: WithId<Sm2StateRecord>): Sm2Record {
  return {
    id: doc._id.toHexString(),
    titleSlug: doc.titleSlug,
    streak: doc.streak,
    interval: doc.interval,
    lastRatedOn: doc.lastRatedOn,
    nextReviewOn: doc.nextReviewOn,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns all SM-2 state records for the given user.
 */
export async function listSm2StatesForUser(userId: string): Promise<Sm2Record[]> {
  await ensureIndexes();
  const collection = await getCollection();
  const docs = await collection
    .find({ userId: asObjectId(userId) })
    .sort({ nextReviewOn: 1 })
    .toArray();
  return docs.map(serialize);
}

/**
 * Deletes every SM-2 state record for the given user.
 * The revision_schedules collection (used by /calendar) is NOT touched.
 */
export async function clearAllSm2StatesForUser(userId: string): Promise<number> {
  await ensureIndexes();
  const collection = await getCollection();
  const result = await collection.deleteMany({ userId: asObjectId(userId) });
  return result.deletedCount;
}

/**
 * Creates an initial SM-2 record for a question that has just been added to the
 * SM-2 queue. The record is "unrated" (streak 0, interval 0, nextReviewOn today)
 * so it immediately appears in the Due queue as a first review.
 *
 * If a record already exists for this titleSlug, this is a no-op.
 */
export async function initializeSm2State(
  userId: string,
  titleSlug: string,
): Promise<Sm2Record> {
  await ensureIndexes();
  const collection = await getCollection();

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  // Upsert — skip if already exists so we don't clobber real progress
  await collection.updateOne(
    { userId: asObjectId(userId), titleSlug },
    {
      $setOnInsert: {
        userId: asObjectId(userId),
        titleSlug,
        streak: 0,
        interval: 0,
        lastRatedOn: null,
        nextReviewOn: todayKey,   // due immediately
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  const doc = await collection.findOne({ userId: asObjectId(userId), titleSlug });
  if (!doc) throw new Error("Failed to initialize SM-2 state.");
  return serialize(doc);
}

/**
 * Applies a rating for the given question, running the SM-2 engine and
 * upserting the result. Creates the record on first use.
 */
export async function applySm2Rating(
  userId: string,
  titleSlug: string,
  rating: Sm2Rating,
): Promise<Sm2Record> {
  await ensureIndexes();
  const collection = await getCollection();

  // Load existing state (if any)
  const existing = await collection.findOne({
    userId: asObjectId(userId),
    titleSlug,
  });

  const currentState: Sm2State | null = existing
    ? {
        streak: existing.streak,
        interval: existing.interval,
        lastRatedOn: existing.lastRatedOn,
        nextReviewOn: existing.nextReviewOn,
      }
    : null;

  // Run the pure engine
  const nextState = computeNextSm2State(currentState, rating);

  const now = new Date();

  if (existing) {
    await collection.updateOne(
      { _id: existing._id },
      {
        $set: {
          streak: nextState.streak,
          interval: nextState.interval,
          lastRatedOn: nextState.lastRatedOn,
          nextReviewOn: nextState.nextReviewOn,
          updatedAt: now,
        },
      },
    );
  } else {
    await collection.insertOne({
      userId: asObjectId(userId),
      titleSlug,
      streak: nextState.streak,
      interval: nextState.interval,
      lastRatedOn: nextState.lastRatedOn,
      nextReviewOn: nextState.nextReviewOn,
      createdAt: now,
      updatedAt: now,
    });
  }

  const updated = await collection.findOne({
    userId: asObjectId(userId),
    titleSlug,
  });

  if (!updated) {
    throw new Error("Failed to upsert SM-2 state.");
  }

  return serialize(updated);
}
