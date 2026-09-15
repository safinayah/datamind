/**
 * Knowledge Base DB helpers
 * CRUD operations for knowledgeArticles and knowledgeChunks tables.
 */

import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  knowledgeArticles,
  knowledgeChunks,
  InsertKnowledgeArticle,
} from "../drizzle/schema";

// ─── Articles ─────────────────────────────────────────────────────────────────

export async function listAllArticles() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(knowledgeArticles)
    .orderBy(desc(knowledgeArticles.createdAt));
}

export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [article] = await db
    .select()
    .from(knowledgeArticles)
    .where(eq(knowledgeArticles.id, id));
  return article ?? null;
}

export async function createArticle(data: InsertKnowledgeArticle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(knowledgeArticles).values(data).$returningId();
  return result.id;
}

export async function updateArticle(
  id: number,
  data: Partial<Pick<InsertKnowledgeArticle, "title" | "topic" | "content" | "source" | "sourceUrl" | "isActive">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(knowledgeArticles).set(data).where(eq(knowledgeArticles.id, id));
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete chunks first (no FK constraint enforcement in TiDB by default)
  await db.delete(knowledgeChunks).where(eq(knowledgeChunks.articleId, id));
  await db.delete(knowledgeArticles).where(eq(knowledgeArticles.id, id));
}

// ─── Chunks ───────────────────────────────────────────────────────────────────

export async function getChunkCountForArticle(articleId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ id: knowledgeChunks.id })
    .from(knowledgeChunks)
    .where(eq(knowledgeChunks.articleId, articleId));
  return rows.length;
}
