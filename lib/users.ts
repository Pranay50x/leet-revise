import { Collection, WithId } from "mongodb";

import { getDatabase } from "@/lib/mongodb";

type UserRecord = {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

export type UserDocument = WithId<UserRecord>;

type NewUserInput = {
  name: string;
  email: string;
  passwordHash: string;
};

const USERS_COLLECTION = "users";
let userEmailIndexReady = false;

async function getUsersCollection(): Promise<Collection<UserRecord>> {
  const db = await getDatabase();
  return db.collection<UserRecord>(USERS_COLLECTION);
}

export async function ensureUserIndexes(): Promise<void> {
  if (userEmailIndexReady) {
    return;
  }

  const users = await getUsersCollection();
  await users.createIndex({ email: 1 }, { unique: true });
  userEmailIndexReady = true;
}

export async function findUserByEmail(
  email: string,
): Promise<UserDocument | null> {
  const users = await getUsersCollection();
  return users.findOne({ email: email.toLowerCase() });
}

export async function createUser(input: NewUserInput): Promise<string> {
  await ensureUserIndexes();

  const users = await getUsersCollection();
  const result = await users.insertOne({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    createdAt: new Date(),
  });

  return result.insertedId.toHexString();
}
