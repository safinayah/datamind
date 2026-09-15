import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  conversations, conversationMessages,
  InsertConversation, InsertConversationMessage,
} from "../drizzle/schema";

// ── Conversations ─────────────────────────────────────────────────────────────

export async function createConversation(userId: number, title: string, tone: "professional" | "conversational" | "technical", topicRule?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const values: InsertConversation = { userId, title, tone, ...(topicRule ? { topicRule } : {}) };
  await db.insert(conversations).values(values);
  const created = await db.select().from(conversations)
    .where(and(eq(conversations.userId, userId)))
    .orderBy(desc(conversations.createdAt))
    .limit(1);
  return created[0]!;
}

export async function listConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function getConversation(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function renameConversation(id: number, userId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(conversations)
    .set({ title })
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
}

export async function deleteConversation(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Delete all messages first
  await db.delete(conversationMessages).where(eq(conversationMessages.conversationId, id));
  await db.delete(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
}

export async function updateConversationTone(id: number, userId: number, tone: "professional" | "conversational" | "technical") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(conversations)
    .set({ tone })
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
}

export async function touchConversation(id: number) {
  const db = await getDb();
  if (!db) return;
  // updatedAt auto-updates via onUpdateNow(), just do a no-op update
  await db.update(conversations).set({ title: undefined } as any).where(eq(conversations.id, id));
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function addMessage(msg: InsertConversationMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(conversationMessages).values(msg);
}

export async function getMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversationMessages)
    .where(eq(conversationMessages.conversationId, conversationId))
    .orderBy(conversationMessages.createdAt);
}
