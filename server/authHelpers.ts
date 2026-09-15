import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import type { InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
}

export async function findUserByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
  return result[0] ?? null;
}

export async function findUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createEmailUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if email already exists
  const existing = await findUserByEmail(data.email);
  if (existing) throw new Error("EMAIL_EXISTS");

  const passwordHash = await hashPassword(data.password);
  const openId = `email_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    loginMethod: "email",
    passwordHash,
    emailVerified: false,
    role: "user",
    lastSignedIn: new Date(),
  });

  const created = await findUserByEmail(data.email);
  return created!;
}

export async function loginEmailUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) throw new Error("INVALID_CREDENTIALS");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  // Update lastSignedIn
  const db = await getDb();
  if (db) {
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
  }

  return user;
}

export async function upsertGoogleUser(data: {
  googleId: string;
  email: string;
  name: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user exists by googleId or email
  let user = await findUserByGoogleId(data.googleId);
  if (!user) {
    user = await findUserByEmail(data.email);
  }

  if (user) {
    // Update googleId if missing
    await db.update(users).set({
      googleId: data.googleId,
      lastSignedIn: new Date(),
      name: data.name,
    }).where(eq(users.id, user.id));
    return { ...user, googleId: data.googleId, name: data.name };
  }

  // Create new user
  const openId = `google_${data.googleId}`;
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    loginMethod: "google",
    googleId: data.googleId,
    emailVerified: true,
    role: "user",
    lastSignedIn: new Date(),
  });

  return await findUserByEmail(data.email);
}
