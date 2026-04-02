import { Collection, ObjectId, WithId } from "mongodb";

import type { LeetCodeQuestion } from "@/lib/leetcode";
import {
  buildReviewDates,
  sortAndDedupeDateKeys,
  toDateKey,
  type ScheduledQuestion,
} from "@/lib/revision-schedule";
import { getDatabase } from "@/lib/mongodb";

type ScheduledQuestionRecord = {
  userId: ObjectId;
  question: LeetCodeQuestion;
  solvedOn: string;
  reviewDates: string[];
  completedReviewCounts: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
};

const COLLECTION = "revision_schedules";
let indexesReady = false;

async function getCollection(): Promise<Collection<ScheduledQuestionRecord>> {
  const db = await getDatabase();
  return db.collection<ScheduledQuestionRecord>(COLLECTION);
}

async function ensureIndexes(): Promise<void> {
  if (indexesReady) {
    return;
  }

  const collection = await getCollection();
  await collection.createIndex({ userId: 1, "question.titleSlug": 1 }, { unique: true });
  await collection.createIndex({ userId: 1, updatedAt: -1 });
  indexesReady = true;
}

function asObjectId(value: string): ObjectId {
  if (!ObjectId.isValid(value)) {
    throw new Error("Invalid ObjectId.");
  }

  return new ObjectId(value);
}

function sanitizeCompletedCounts(
  input: Record<string, unknown> | undefined,
): Record<string, number> {
  if (!input) {
    return {};
  }

  const entries = Object.entries(input).flatMap(([key, value]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || typeof value !== "number") {
      return [];
    }

    return [[key, Math.max(0, Math.floor(value))] as const];
  });

  return Object.fromEntries(entries);
}

function serialize(doc: WithId<ScheduledQuestionRecord>): ScheduledQuestion {
  return {
    id: doc._id.toHexString(),
    question: doc.question,
    solvedOn: doc.solvedOn,
    reviewDates: doc.reviewDates,
    completedReviewCounts: doc.completedReviewCounts,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listSchedulesForUser(userId: string): Promise<ScheduledQuestion[]> {
  await ensureIndexes();
  const collection = await getCollection();
  const docs = await collection.find({ userId: asObjectId(userId) }).sort({ updatedAt: -1 }).toArray();
  return docs.map(serialize);
}

export async function createScheduleForUser(
  userId: string,
  question: LeetCodeQuestion,
): Promise<ScheduledQuestion> {
  await ensureIndexes();
  const collection = await getCollection();

  const now = new Date();
  const record: ScheduledQuestionRecord = {
    userId: asObjectId(userId),
    question,
    solvedOn: toDateKey(now),
    reviewDates: buildReviewDates(question.difficulty, now),
    completedReviewCounts: {},
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(record);
  const inserted = await collection.findOne({ _id: result.insertedId });

  if (!inserted) {
    throw new Error("Failed to create schedule record.");
  }

  return serialize(inserted);
}

export async function incrementDoneCount(
  userId: string,
  scheduleId: string,
  dateKey: string,
): Promise<ScheduledQuestion | null> {
  await ensureIndexes();
  const collection = await getCollection();

  const now = new Date();
  await collection.updateOne(
    { _id: asObjectId(scheduleId), userId: asObjectId(userId) },
    {
      $inc: { [`completedReviewCounts.${dateKey}`]: 1 },
      $set: { updatedAt: now },
    },
  );

  const updated = await collection.findOne({ _id: asObjectId(scheduleId), userId: asObjectId(userId) });
  return updated ? serialize(updated) : null;
}

export async function updateScheduleForUser(
  userId: string,
  scheduleId: string,
  input: {
    reviewDates: string[];
    completedReviewCounts?: Record<string, unknown>;
  },
): Promise<ScheduledQuestion | null> {
  await ensureIndexes();
  const collection = await getCollection();

  const reviewDates = sortAndDedupeDateKeys(
    input.reviewDates.filter((dateKey) => /^\d{4}-\d{2}-\d{2}$/.test(dateKey)),
  );
  const completedReviewCounts = sanitizeCompletedCounts(input.completedReviewCounts);

  await collection.updateOne(
    { _id: asObjectId(scheduleId), userId: asObjectId(userId) },
    {
      $set: {
        reviewDates,
        completedReviewCounts,
        updatedAt: new Date(),
      },
    },
  );

  const updated = await collection.findOne({ _id: asObjectId(scheduleId), userId: asObjectId(userId) });
  return updated ? serialize(updated) : null;
}

export async function deleteScheduleForUser(userId: string, scheduleId: string): Promise<boolean> {
  await ensureIndexes();
  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: asObjectId(scheduleId), userId: asObjectId(userId) });
  return result.deletedCount === 1;
}