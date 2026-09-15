import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { siteContent } from "../drizzle/schema";
import type { InsertSiteContent } from "../drizzle/schema";

export async function getAllContent() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteContent).orderBy(siteContent.section, siteContent.sortOrder);
}

export async function getContentBySection(section: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteContent)
    .where(eq(siteContent.section, section))
    .orderBy(siteContent.sortOrder);
}

export async function upsertContent(data: {
  section: string;
  key: string;
  value: string;
  type?: "text" | "list" | "url" | "boolean";
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(siteContent)
    .where(and(eq(siteContent.section, data.section), eq(siteContent.key, data.key)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(siteContent)
      .set({ value: data.value, type: data.type ?? "text", sortOrder: data.sortOrder ?? 0 })
      .where(eq(siteContent.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(siteContent).values({
      section: data.section,
      key: data.key,
      value: data.value,
      type: data.type ?? "text",
      sortOrder: data.sortOrder ?? 0,
    });
    return result[0].insertId;
  }
}

export async function updateContentById(id: number, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(siteContent).set({ value }).where(eq(siteContent.id, id));
}

export async function deleteContentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(siteContent).where(eq(siteContent.id, id));
}

export async function createContent(data: Omit<InsertSiteContent, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(siteContent).values(data);
  return result[0].insertId;
}
