import { boolean, int, mediumtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with email/password and Google OAuth fields.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Email/password auth
  passwordHash: varchar("passwordHash", { length: 256 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  // Google OAuth
  googleId: varchar("googleId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Testimonials table
export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }),
  role: varchar("role", { length: 128 }),
  company: varchar("company", { length: 128 }),
  content: text("content").notNull(),
  isAnonymous: boolean("isAnonymous").default(false).notNull(),
  testimonialType: mysqlEnum("testimonialType", ["personal", "tool"]).default("personal").notNull(),
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

// Chat sessions — one per visitor (identified by a UUID stored in localStorage)
export const chatSessions = mysqlTable("chatSessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  tone: mysqlEnum("tone", ["professional", "conversational", "technical"]).default("conversational").notNull(),
  freeMessagesUsed: int("freeMessagesUsed").default(0).notNull(),
  extraMessagesPurchased: int("extraMessagesPurchased").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

// Chat messages — each message in a session
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// Chat rules — admin-defined rules that shape the chatbot's behaviour
export const chatRules = mysqlTable("chatRules", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 128 }).notNull(),
  rule: text("rule").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatRule = typeof chatRules.$inferSelect;
export type InsertChatRule = typeof chatRules.$inferInsert;

// Site content — CMS table for managing all page content dynamically
export const siteContent = mysqlTable("siteContent", {
  id: int("id").autoincrement().primaryKey(),
  section: varchar("section", { length: 64 }).notNull(),    // e.g. 'hero', 'services', 'projects'
  key: varchar("key", { length: 128 }).notNull(),            // e.g. 'title', 'subtitle', 'item_1'
  value: text("value").notNull(),
  type: mysqlEnum("type", ["text", "list", "url", "boolean"]).default("text").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteContent = typeof siteContent.$inferSelect;
export type InsertSiteContent = typeof siteContent.$inferInsert;

// Conversations — named multi-turn chat threads tied to a user
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),          // references users.id
  title: varchar("title", { length: 256 }).default("New Conversation").notNull(),
  tone: mysqlEnum("tone", ["professional", "conversational", "technical"]).default("conversational").notNull(),
  topicRule: text("topicRule"),              // optional AI rule injected from the selected quick-start topic
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// Conversation messages — messages within a named conversation (supports media)
export const conversationMessages = mysqlTable("conversationMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  mediaUrl: text("mediaUrl"),               // S3 URL if a file was attached
  mediaType: varchar("mediaType", { length: 64 }), // e.g. 'image/png', 'application/pdf'
  mediaName: varchar("mediaName", { length: 256 }), // original filename
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type InsertConversationMessage = typeof conversationMessages.$inferInsert;

// Contact messages — submitted via the contact form
export const contactMessages = mysqlTable("contactMessages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 256 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

// Data Plans — AI-generated personalized fix plans for user data problems
export const dataPlans = mysqlTable("dataPlans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),                          // null = anonymous guest
  title: varchar("title", { length: 256 }).notNull(),
  problemDescription: text("problemDescription").notNull(),
  industry: varchar("industry", { length: 128 }),
  companySize: varchar("companySize", { length: 64 }),
  urgency: mysqlEnum("urgency", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  planContent: text("planContent").notNull(),     // Full AI-generated plan (markdown)
  status: mysqlEnum("status", ["draft", "generated", "saved"]).default("generated").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DataPlan = typeof dataPlans.$inferSelect;
export type InsertDataPlan = typeof dataPlans.$inferInsert;

// Chat Topics — admin-managed quick start topics shown on the dashboard
export const chatTopics = mysqlTable("chatTopics", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 128 }).notNull(),
  subtitle: varchar("subtitle", { length: 256 }),
  icon: varchar("icon", { length: 64 }).default("MessageSquare").notNull(), // lucide icon name
  aiRule: text("aiRule"),               // custom system instruction injected when this topic is selected
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatTopic = typeof chatTopics.$inferSelect;
export type InsertChatTopic = typeof chatTopics.$inferInsert;

// Data Impact Reports — AI-generated financial impact + valuation reports
export const dataImpactReports = mysqlTable("dataImpactReports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),                          // null = anonymous guest
  shareToken: varchar("shareToken", { length: 64 }).notNull().unique(), // for public sharing
  title: varchar("title", { length: 256 }).notNull(),
  problemDescription: text("problemDescription").notNull(),
  industry: varchar("industry", { length: 128 }),
  companyRevenue: varchar("companyRevenue", { length: 64 }), // revenue range
  teamSize: varchar("teamSize", { length: 64 }),
  regulations: text("regulations"),               // comma-separated list e.g. "GDPR,HIPAA"
  reportJson: text("reportJson").notNull(),        // full structured report as JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DataImpactReport = typeof dataImpactReports.$inferSelect;
export type InsertDataImpactReport = typeof dataImpactReports.$inferInsert;

// Knowledge Base Articles — curated domain content for RAG retrieval
export const knowledgeArticles = mysqlTable("knowledgeArticles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  topic: varchar("topic", { length: 128 }).notNull(), // e.g. "data quality", "governance", "cloud"
  content: text("content").notNull(),                 // full article text (markdown)
  source: varchar("source", { length: 256 }).notNull(), // e.g. "Gartner 2025", "DAMA-DMBOK v2"
  sourceUrl: varchar("sourceUrl", { length: 512 }),   // optional URL
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertKnowledgeArticle = typeof knowledgeArticles.$inferInsert;

// Knowledge Chunks — chunked + embedded segments of knowledge articles for vector retrieval
export const knowledgeChunks = mysqlTable("knowledgeChunks", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),             // references knowledgeArticles.id
  chunkIndex: int("chunkIndex").notNull(),            // 0-based position within article
  chunkText: text("chunkText").notNull(),             // the raw text of this chunk
  embeddingJson: mediumtext("embeddingJson"),          // JSON array of floats (embedding vector)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type InsertKnowledgeChunk = typeof knowledgeChunks.$inferInsert;
