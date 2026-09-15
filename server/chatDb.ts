import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  chatSessions, chatMessages, chatRules,
  InsertChatSession, InsertChatMessage, InsertChatRule,
} from "../drizzle/schema";

const FREE_MESSAGE_LIMIT = 10000; // No practical limit — unlimited conversations

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function getOrCreateSession(sessionId: string, tone?: "professional" | "conversational" | "technical") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const existing = await db.select().from(chatSessions).where(eq(chatSessions.sessionId, sessionId)).limit(1);
  if (existing.length > 0) return existing[0]!;

  const values: InsertChatSession = {
    sessionId,
    tone: tone ?? "conversational",
    freeMessagesUsed: 0,
    extraMessagesPurchased: 0,
  };
  await db.insert(chatSessions).values(values);
  const created = await db.select().from(chatSessions).where(eq(chatSessions.sessionId, sessionId)).limit(1);
  return created[0]!;
}

export async function incrementFreeMessages(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const session = await getOrCreateSession(sessionId);
  await db.update(chatSessions)
    .set({ freeMessagesUsed: session.freeMessagesUsed + 1 })
    .where(eq(chatSessions.sessionId, sessionId));
}

export async function canSendMessage(sessionId: string): Promise<{ allowed: boolean; remaining: number; total: number }> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const session = await getOrCreateSession(sessionId);
  const total = FREE_MESSAGE_LIMIT + session.extraMessagesPurchased;
  const used = session.freeMessagesUsed;
  return { allowed: used < total, remaining: Math.max(0, total - used), total };
}

export async function addExtraMessages(sessionId: string, count: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const session = await getOrCreateSession(sessionId);
  await db.update(chatSessions)
    .set({ extraMessagesPurchased: session.extraMessagesPurchased + count })
    .where(eq(chatSessions.sessionId, sessionId));
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function saveMessage(msg: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(chatMessages).values(msg);
}

export async function getSessionMessages(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);
}

// ── Rules ─────────────────────────────────────────────────────────────────────

export async function getActiveRules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatRules).where(eq(chatRules.isActive, true));
}

/**
 * Returns a formatted string block of active admin rules to inject into any AI system prompt.
 * Returns an empty string if no rules are active.
 */
export async function getActiveRulesText(): Promise<string> {
  const rules = await getActiveRules();
  if (rules.length === 0) return "";
  return `\n\n## Global Rules (set by admin — MUST be followed in every response)\nThese rules apply to ALL responses regardless of topic or context:\n${rules.map(r => `- ${r.rule}`).join("\n")}`;
}

export async function getAllRules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatRules).orderBy(desc(chatRules.createdAt));
}

export async function createRule(rule: InsertChatRule) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(chatRules).values(rule);
}

export async function updateRule(id: number, patch: Partial<Pick<InsertChatRule, "title" | "rule" | "isActive">>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(chatRules).set(patch).where(eq(chatRules.id, id));
}

export async function deleteRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(chatRules).where(eq(chatRules.id, id));
}

// ── Admin: all sessions ───────────────────────────────────────────────────────

export async function getAllSessions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatSessions).orderBy(desc(chatSessions.createdAt));
}

export async function getMessagesForSession(sessionId: string) {
  return getSessionMessages(sessionId);
}

export { FREE_MESSAGE_LIMIT };
