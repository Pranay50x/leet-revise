import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { createUser, findUserByEmail } from "@/lib/users";

type RegisterPayload = {
  name?: string;
  email?: string;
  password?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asDuplicateKeyError(error: unknown): { code?: number } | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    return error as { code?: number };
  }

  return null;
}

export async function POST(request: Request) {
  let body: RegisterPayload;

  try {
    body = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required." },
      { status: 400 },
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 },
    );
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);

  try {
    const userId = await createUser({
      name,
      email,
      passwordHash,
    });

    return NextResponse.json({ userId }, { status: 201 });
  } catch (error) {
    const duplicateError = asDuplicateKeyError(error);

    if (duplicateError?.code === 11000) {
      return NextResponse.json(
        { error: "Email is already registered." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Could not create account right now. Please try again." },
      { status: 500 },
    );
  }
}
