import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createTestimonial,
  getApprovedTestimonials,
  getAllTestimonials,
  approveTestimonial,
  deleteTestimonial,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import {
  getOrCreateSession,
  canSendMessage,
  incrementFreeMessages,
  saveMessage,
  getSessionMessages,
  getActiveRules,
  getActiveRulesText,
  getAllRules,
  createRule,
  updateRule,
  deleteRule,
  getAllSessions,
  getMessagesForSession,
  FREE_MESSAGE_LIMIT,
} from "./chatDb";
import { buildSystemPrompt } from "./ayahPrompt";
import { retrieveContext, formatContextBlock, ingestArticle } from "./rag";
import {
  listAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getChunkCountForArticle,
} from "./knowledgeDb";
import {
  createEmailUser,
  loginEmailUser,
  findUserById,
} from "./authHelpers";
import {
  getAllContent,
  getContentBySection,
  upsertContent,
  updateContentById,
  deleteContentById,
  createContent,
} from "./cmsDb";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { contactMessages } from "../drizzle/schema";
import {
  createConversation,
  listConversations,
  getConversation,
  renameConversation,
  deleteConversation,
  updateConversationTone,
  addMessage,
  getMessages,
} from "./conversationsDb";

// ── JWT helpers for email/password sessions ───────────────────────────────────
const jwtSecret = new TextEncoder().encode(ENV.cookieSecret);

async function signUserJwt(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId), type: "email_auth" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(jwtSecret);
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie("email_auth_token", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // Email/password registration
    register: publicProcedure
      .input(z.object({
        name: z.string().min(2).max(64),
        email: z.string().email(),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await createEmailUser(input);
          const token = await signUserJwt(user.id);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, {
            ...cookieOptions,
            maxAge: 30 * 24 * 60 * 60 * 1000,
          });
          return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
        } catch (err: any) {
          if (err.message === "EMAIL_EXISTS") {
            throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Registration failed. Please try again." });
        }
      }),

    // Email/password login
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await loginEmailUser(input.email, input.password);
          const token = await signUserJwt(user.id);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, {
            ...cookieOptions,
            maxAge: 30 * 24 * 60 * 60 * 1000,
          });
          return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
        } catch {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
        }
      }),

    // Verify email auth token (used by frontend to restore session)
    verifyEmailToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        try {
          const { payload } = await jwtVerify(input.token, jwtSecret);
          const userId = Number(payload.sub);
          const user = await findUserById(userId);
          if (!user) return null;
          return { id: user.id, name: user.name, email: user.email, role: user.role };
        } catch {
          return null;
        }
      }),

    // Get full profile for the logged-in user
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await findUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
        role: user.role,
        createdAt: user.createdAt,
        lastSignedIn: user.lastSignedIn,
      };
    }),
  }),

  // ── Testimonials ─────────────────────────────────────────────────────────────
  testimonials: router({
    list: publicProcedure
      .input(z.object({ testimonialType: z.enum(["personal", "tool"]).optional() }).optional())
      .query(async ({ input }) => getApprovedTestimonials(input?.testimonialType)),

    submit: publicProcedure
      .input(z.object({
        name: z.string().optional(),
        role: z.string().optional(),
        company: z.string().optional(),
        content: z.string().min(10, "Please write at least 10 characters"),
        isAnonymous: z.boolean().default(false),
        testimonialType: z.enum(["personal", "tool"]).default("personal"),
      }))
      .mutation(async ({ input }) => {
        await createTestimonial({
          name: input.isAnonymous ? null : (input.name ?? null),
          role: input.isAnonymous ? null : (input.role ?? null),
          company: input.isAnonymous ? null : (input.company ?? null),
          content: input.content,
          isAnonymous: input.isAnonymous,
          testimonialType: input.testimonialType,
          approved: false,
        });
        await notifyOwner({
          title: "New Testimonial Submitted",
          content: `A new ${input.testimonialType === "tool" ? "DataMind AI" : "personal"} testimonial was submitted${input.isAnonymous ? " (anonymous)" : ` by ${input.name ?? "someone"}`}. Please review and approve it.`,
        });
        return { success: true };
      }),

    adminList: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getAllTestimonials();
    }),

    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await approveTestimonial(input.id);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await deleteTestimonial(input.id);
        return { success: true };
      }),
  }),

  // ── Chat ──────────────────────────────────────────────────────────────────
  chat: router({
    startSession: publicProcedure
      .input(z.object({
        sessionId: z.string().uuid(),
        tone: z.enum(["professional", "conversational", "technical"]).default("conversational"),
      }))
      .mutation(async ({ input }) => {
        const session = await getOrCreateSession(input.sessionId, input.tone);
        const status = await canSendMessage(input.sessionId);
        return { session, ...status, freeLimit: FREE_MESSAGE_LIMIT };
      }),

    status: publicProcedure
      .input(z.object({ sessionId: z.string().uuid() }))
      .query(async ({ input }) => {
        const session = await getOrCreateSession(input.sessionId);
        const status = await canSendMessage(input.sessionId);
        return { session, ...status, freeLimit: FREE_MESSAGE_LIMIT };
      }),

    history: publicProcedure
      .input(z.object({ sessionId: z.string().uuid() }))
      .query(async ({ input }) => {
        return getSessionMessages(input.sessionId);
      }),

    send: publicProcedure
      .input(z.object({
        sessionId: z.string().uuid(),
        message: z.string().min(1).max(2000),
      }))
      .mutation(async ({ input }) => {
        const session = await getOrCreateSession(input.sessionId);
        await saveMessage({ sessionId: input.sessionId, role: "user", content: input.message });

        const history = await getSessionMessages(input.sessionId);
        const recentHistory = history.slice(-20); // keep last 20 messages for context
        const systemPrompt = await buildSystemPrompt(session.tone as "professional" | "conversational" | "technical");

        // RAG: retrieve relevant knowledge chunks for the user's message
        const ragChunks = await retrieveContext(input.message, 3).catch(() => []);
        const ragContext = formatContextBlock(ragChunks);
        const systemWithRag = ragContext ? `${systemPrompt}\n\n${ragContext}` : systemPrompt;

        const messages = [
          { role: "system" as const, content: systemWithRag },
          ...recentHistory.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        ];

        const llmResponse = await invokeLLM({ messages });
        const rawContent = llmResponse.choices?.[0]?.message?.content;
        const reply = typeof rawContent === "string" ? rawContent : "I'm sorry, I couldn't generate a response. Please try again.";
        await saveMessage({ sessionId: input.sessionId, role: "assistant", content: reply });;
        await incrementFreeMessages(input.sessionId);

        if (session.freeMessagesUsed === 0) {
          await notifyOwner({
            title: "New Chat Started",
            content: `A visitor started a new conversation on your portfolio (tone: ${session.tone}).`,
          }).catch(() => {});
        }

        return { success: true, limitReached: false, reply, remaining: 9999 };
      }),
  }),

  // ── CMS ───────────────────────────────────────────────────────────────────
  cms: router({
    // Public: get content for a section
    getSection: publicProcedure
      .input(z.object({ section: z.string() }))
      .query(async ({ input }) => getContentBySection(input.section)),

    // Public: get all content
    getAll: publicProcedure.query(async () => getAllContent()),

    // Admin: upsert a content item
    upsert: protectedProcedure
      .input(z.object({
        section: z.string().min(1).max(64),
        key: z.string().min(1).max(128),
        value: z.string(),
        type: z.enum(["text", "list", "url", "boolean"]).default("text"),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const id = await upsertContent(input);
        return { success: true, id };
      }),

    // Admin: update by ID
    update: protectedProcedure
      .input(z.object({ id: z.number(), value: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await updateContentById(input.id, input.value);
        return { success: true };
      }),

    // Admin: delete by ID
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await deleteContentById(input.id);
        return { success: true };
      }),

    // Admin: create new content item
    create: protectedProcedure
      .input(z.object({
        section: z.string().min(1).max(64),
        key: z.string().min(1).max(128),
        value: z.string(),
        type: z.enum(["text", "list", "url", "boolean"]).default("text"),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const id = await createContent(input);
        return { success: true, id };
      }),
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    listRules: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getAllRules();
    }),

    createRule: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(128),
        rule: z.string().min(1),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await createRule(input);
        return { success: true };
      }),

    updateRule: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(128).optional(),
        rule: z.string().min(1).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...patch } = input;
        await updateRule(id, patch);
        return { success: true };
      }),

    deleteRule: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await deleteRule(input.id);
        return { success: true };
      }),

    listSessions: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getAllSessions();
    }),

    getConversation: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return getMessagesForSession(input.sessionId);
      }),
  }),

  // ── Contact ──────────────────────────────────────────────────────────────────
  contact: router({
    send: publicProcedure
      .input(z.object({
        name: z.string().min(2, "Name must be at least 2 characters").max(128),
        email: z.string().email("Please enter a valid email address"),
        subject: z.string().min(3, "Subject must be at least 3 characters").max(256),
        message: z.string().min(10, "Message must be at least 10 characters").max(5000),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Service temporarily unavailable" });
        await db.insert(contactMessages).values({
          name: input.name,
          email: input.email,
          subject: input.subject,
          message: input.message,
        });
        // Notify owner
        await notifyOwner({
          title: `New Message: ${input.subject}`,
          content: `From: ${input.name} (${input.email})\n\n${input.message}`,
        });
        return { success: true };
      }),
  }),

  // ── Conversations (multi-chat for logged-in users) ────────────────────────
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return listConversations(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(256).default("New Conversation"),
        tone: z.enum(["professional", "conversational", "technical"]).default("conversational"),
        topicRule: z.string().max(2000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return createConversation(ctx.user.id, input.title, input.tone, input.topicRule);
      }),

    rename: protectedProcedure
      .input(z.object({ id: z.number(), title: z.string().min(1).max(256) }))
      .mutation(async ({ input, ctx }) => {
        await renameConversation(input.id, ctx.user.id, input.title);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteConversation(input.id, ctx.user.id);
        return { success: true };
      }),
    updateTone: protectedProcedure
      .input(z.object({ id: z.number(), tone: z.enum(["professional", "conversational", "technical"]) }))
      .mutation(async ({ input, ctx }) => {
        await updateConversationTone(input.id, ctx.user.id, input.tone);
        return { success: true };
      }),

    messages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const conv = await getConversation(input.conversationId, ctx.user.id);
        if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        return getMessages(input.conversationId);
      }),

    send: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        message: z.string().min(1).max(10000),
        mediaUrl: z.string().url().optional(),
        mediaType: z.string().optional(),
        mediaName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const conv = await getConversation(input.conversationId, ctx.user.id);
        if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });

        // Save user message
        await addMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.message,
          mediaUrl: input.mediaUrl,
          mediaType: input.mediaType,
          mediaName: input.mediaName,
        });

        // Build message history for LLM (last 20 messages)
        const history = await getMessages(input.conversationId);
        const recentHistory = history.slice(-20);
        const systemPrompt = await buildSystemPrompt(conv.tone as "professional" | "conversational" | "technical", conv.topicRule ?? undefined);

        // RAG: retrieve relevant knowledge chunks for the user's message
        const ragChunks = await retrieveContext(input.message, 3).catch(() => []);
        const ragContext = formatContextBlock(ragChunks);
        const systemWithRag = ragContext ? `${systemPrompt}\n\n${ragContext}` : systemPrompt;

        // Build LLM messages — include media as image_url if it's an image
        const llmMessages: any[] = [
          { role: "system", content: systemWithRag },
          ...recentHistory.map(m => {
            if (m.role === "user" && m.mediaUrl && m.mediaType?.startsWith("image/")) {
              return {
                role: "user",
                content: [
                  { type: "text", text: m.content || "[Image attached]" },
                  { type: "image_url", image_url: { url: m.mediaUrl, detail: "auto" } },
                ],
              };
            }
            return { role: m.role, content: m.content };
          }),
        ];

        const llmResponse = await invokeLLM({ messages: llmMessages });
        const rawContent = llmResponse.choices?.[0]?.message?.content;
        const reply = typeof rawContent === "string" ? rawContent : "I'm sorry, I couldn't generate a response. Please try again.";

        await addMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: reply,
        });

        // Auto-title the conversation after first message
        if (history.length === 0 && input.message.length > 0) {
          const shortTitle = input.message.slice(0, 60) + (input.message.length > 60 ? "..." : "");
          await renameConversation(input.conversationId, ctx.user.id, shortTitle);
        }

        return { success: true, reply };
      }),
  }),

  // ─── Data Plan Generator ──────────────────────────────────────────────────
  plans: router({
    // Generate an AI data plan from a user's problem description
    generate: publicProcedure
      .input(z.object({
        title: z.string().min(3).max(200),
        problemDescription: z.string().min(20).max(5000),
        industry: z.string().optional(),
        companySize: z.string().optional(),
        urgency: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        currentTools: z.string().optional(),
        goals: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const planAdminRules = await getActiveRulesText();
        const systemPrompt = `You are DataMind AI — a strategic data intelligence platform. You are generating a focused, actionable data improvement plan for a finance or business professional who needs to understand and fix a data problem in terms of business outcomes, risk reduction, and financial impact.

Your audience thinks in terms of P&L, risk exposure, regulatory compliance, and return on investment. They are not necessarily data engineers — they need a plan they can understand, present to leadership, and actually execute.

Your recommendations draw from:
- DAMA-DMBOK v2 — data management best practices across all 11 knowledge areas
- Gartner 2025 D&A Trends — Decision Intelligence, Data Products, Agentic Analytics
- McKinsey Global Institute — data monetisation and analytics ROI research
- MIT CISR — data governance and digital transformation
- Forrester Research — data strategy and analytics maturity
- DCAM (EDM Council) — data management capability assessment
- ISO 8000 and ISO/IEC 25012 — data quality standards
- DQAF (IMF/World Bank) — data quality assessment framework
- BCBS 239, SOX, GDPR, CCPA, HIPAA, MiFID II, DORA — regulatory frameworks (cite where applicable)
- COSO ERM — enterprise risk management and data integrity
- Harvard Business Review — data leadership and analytics ROI

Focus on practical, business-outcome-driven approaches. Prioritise 2022–2025 research. Do not limit recommendations to any single certification body.

Format the plan in clean Markdown with the following sections:

# Problem Diagnosis
Restate the problem in plain business terms. What is broken, why it matters financially or operationally, and what the root cause likely is.

# Business Impact at Stake
Quantify or describe what is at risk if this is not fixed — revenue, reporting accuracy, regulatory exposure, decision quality, or operational cost. Be honest about uncertainty.

# Strategic Goals
List 3–4 clear, measurable goals this plan will achieve — framed as business outcomes, not technical deliverables.

# Phased Action Plan
Break the solution into 3–4 phases. For each phase:
- **Phase N: [Name]** (Timeline: X weeks)
  - What gets done and why in this order
  - Key tasks
  - Who needs to be involved (finance, IT, data team, external)
  - Expected business outcome at the end of this phase

# Recommended Tools & Approach
List specific tools or approaches with brief, plain-English justifications. Explain the build-vs-buy trade-off where relevant.

# Risks & How to Manage Them
Identify 2–3 real risks (not generic ones) and concrete mitigations.

# How to Measure Success
Define KPIs and checkpoints — framed in business terms (e.g. "reporting error rate drops below 1%", "audit finding resolved", "manual reconciliation time reduced by 60%").

# Quick Wins (First 2 Weeks)
List 2–3 things that can be done immediately to demonstrate progress and build momentum.${planAdminRules}

Be specific and honest. Avoid generic advice. Tailor everything to the industry and company context provided. If something is uncertain, say so and explain what additional information would sharpen the recommendation.`;

        const userPrompt = `Generate a comprehensive data fix plan for the following:

**Problem:** ${input.problemDescription}
**Industry:** ${input.industry || "Not specified"}
**Company Size:** ${input.companySize || "Not specified"}
**Urgency:** ${input.urgency}
**Current Tools:** ${input.currentTools || "Not specified"}
**Goals:** ${input.goals || "Not specified"}`;

        // RAG: retrieve relevant knowledge chunks for the problem description
        const planRagChunks = await retrieveContext(`${input.problemDescription} ${input.industry ?? ""} ${input.goals ?? ""}`, 4).catch(() => []);
        const planRagContext = formatContextBlock(planRagChunks);
        const planSystemWithRag = planRagContext ? `${systemPrompt}\n\n${planRagContext}` : systemPrompt;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: planSystemWithRag },
            { role: "user", content: userPrompt },
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        const planContent: string = typeof rawContent === "string" ? rawContent : (Array.isArray(rawContent) ? rawContent.map((c: { type: string; text?: string }) => c.text ?? "").join("") : "Unable to generate plan. Please try again.");

        // Save to DB
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const { dataPlans } = await import("../drizzle/schema");
        // Build insert payload — userId is optional (null for anonymous)
        const payload = {
          title: input.title,
          problemDescription: input.problemDescription,
          industry: input.industry ?? undefined,
          companySize: input.companySize ?? undefined,
          urgency: input.urgency,
          planContent,
          status: "generated" as const,
          ...(ctx.user?.id != null ? { userId: ctx.user.id } : {}),
        };
        const [plan2] = await db.insert(dataPlans).values(payload).$returningId();

        // Notify owner
        await notifyOwner({
          title: `New Data Plan Generated: ${input.title}`,
          content: `A ${input.urgency} urgency plan was generated for: ${input.problemDescription.slice(0, 100)}...`,
        });

        return { success: true, planId: plan2.id, planContent };
      }),

    // List all plans for the current user
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return [];
      const { dataPlans } = await import("../drizzle/schema");
      const { desc, eq } = await import("drizzle-orm");
      return db.select().from(dataPlans).where(eq(dataPlans.userId, ctx.user.id)).orderBy(desc(dataPlans.createdAt));
    }),

    // Get a single plan by ID
    get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const { dataPlans } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [plan] = await db.select().from(dataPlans).where(eq(dataPlans.id, input.id));
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
      // Only owner or admin can view
      if (plan.userId && plan.userId !== ctx.user?.id && ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      return plan;
    }),

    // Delete a plan
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const { dataPlans } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      await db.delete(dataPlans).where(and(eq(dataPlans.id, input.id), eq(dataPlans.userId, ctx.user.id)));
      return { success: true };
    }),
  }),

  // ─── Chat Topics (Admin-managed quick start topics) ──────────────────────────────
  topics: router({
    // List active topics (public — shown on dashboard)
    list: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return [];
      const { chatTopics } = await import("../drizzle/schema");
      const { asc, eq } = await import("drizzle-orm");
      const topics = await db.select().from(chatTopics).where(eq(chatTopics.isActive, true)).orderBy(asc(chatTopics.sortOrder), asc(chatTopics.id));
      // If no topics in DB yet, seed defaults
      if (topics.length === 0) {
        const defaults = [
          { title: "Data Architecture", subtitle: "Schema design, modeling, EAV", icon: "Database", aiRule: "Focus on database design, schema modeling, normalization, EAV patterns, and data architecture best practices.", sortOrder: 1 },
          { title: "Cloud Cost Optimization", subtitle: "AWS, cost reduction strategies", icon: "Cloud", aiRule: "Focus on AWS cost optimization strategies, infrastructure as code, serverless vs managed services trade-offs, and FinOps best practices.", sortOrder: 2 },
          { title: "ETL Pipeline Design", subtitle: "Prefect, Dask, Python pipelines", icon: "GitBranch", aiRule: "Focus on ETL/ELT pipeline design, orchestration tools like Prefect and Airflow, data transformation patterns, and performance optimization.", sortOrder: 3 },
          { title: "Data Governance", subtitle: "Quality, lineage, stewardship", icon: "Shield", aiRule: "Focus on DAMA-DMBOK data governance framework, data quality dimensions, data lineage, stewardship roles, and governance implementation.", sortOrder: 4 },
          { title: "Power BI & Analytics", subtitle: "Dashboards, DAX, reporting", icon: "BarChart2", aiRule: "Focus on Power BI development, DAX formulas, data modeling for analytics, dashboard design best practices, and report optimization.", sortOrder: 5 },
        ];
        await db.insert(chatTopics).values(defaults);
        return db.select().from(chatTopics).where(eq(chatTopics.isActive, true)).orderBy(asc(chatTopics.sortOrder));
      }
      return topics;
    }),

    // List all topics including inactive (admin only)
    listAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return [];
      const { chatTopics } = await import("../drizzle/schema");
      const { asc } = await import("drizzle-orm");
      return db.select().from(chatTopics).orderBy(asc(chatTopics.sortOrder), asc(chatTopics.id));
    }),

    // Create a new topic (admin only)
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(2).max(128),
        subtitle: z.string().max(256).optional(),
        icon: z.string().max(64).default("MessageSquare"),
        aiRule: z.string().max(2000).optional(),
        isActive: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { chatTopics } = await import("../drizzle/schema");
        const [topic] = await db.insert(chatTopics).values(input).$returningId();
        return { success: true, id: topic.id };
      }),

    // Update a topic (admin only)
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(2).max(128).optional(),
        subtitle: z.string().max(256).optional(),
        icon: z.string().max(64).optional(),
        aiRule: z.string().max(2000).optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { chatTopics } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { id, ...data } = input;
        await db.update(chatTopics).set(data).where(eq(chatTopics.id, id));
        return { success: true };
      }),

    // Delete a topic (admin only)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { chatTopics } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(chatTopics).where(eq(chatTopics.id, input.id));
        return { success: true };
      }),
  }),

  // ── Data Impact Reports ───────────────────────────────────────────────────
  dataImpact: router({
    // Generate a new Data Impact Report via AI
    generate: publicProcedure
      .input(z.object({
        problemDescription: z.string().min(20).max(3000),
        industry: z.string().max(128).optional(),
        companyRevenue: z.string().max(64).optional(),
        teamSize: z.string().max(64).optional(),
        regulations: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { dataImpactReports } = await import("../drizzle/schema");
        const { randomBytes } = await import("crypto");

        // Build the AI prompt
        const regulationList = input.regulations?.length ? input.regulations.join(", ") : "Not specified";
        const hasBusinessSize = !!(input.companyRevenue && input.companyRevenue !== "Prefer not to say" && input.teamSize);

        const impactAdminRules = await getActiveRulesText();
        const systemPrompt = `You are a strategic data intelligence advisor. Your audience is financially sophisticated — analysts, controllers, CFOs, risk managers, and strategy leaders who think in terms of P&L impact, risk-adjusted returns, regulatory exposure, and capital allocation. They need to understand data problems in the language of business outcomes, not technical jargon.

Your reports must be:
- Financially grounded: every cost item connects to a real business line — revenue, operating cost, regulatory fine, or opportunity cost
- Intellectually honest: show your assumptions, use ranges not false precision, acknowledge what you don't know
- Actionable: recommendations should be prioritised by financial impact and implementation feasibility, not theoretical completeness
- Readable by a CFO who has 10 minutes: clear executive summary, clean numbers, plain-English narrative

You draw from the broadest set of trusted research, including:
- Infonomics (Doug Laney, 2017) — information economics and data asset valuation
- DAMA-DMBOK v2 — data management best practices across all 11 knowledge areas
- Gartner 2025 D&A Trends — Decision Intelligence, Data Products, Agentic Analytics, Metadata Management
- McKinsey Global Institute — data monetisation, AI adoption, and data-driven transformation
- Forrester Research — data strategy and analytics maturity
- MIT CISR — data governance and digital platform research
- Harvard Business Review — data leadership and analytics ROI
- DCAM (EDM Council) — data management capability assessment
- ISO 8000 and ISO/IEC 25012 — international data quality standards
- DQAF (IMF/World Bank) — data quality assessment framework
- BCBS 239 — Basel Committee principles for risk data aggregation
- SOX, GDPR, CCPA, HIPAA, MiFID II, DORA — regulatory compliance frameworks
- COSO ERM — enterprise risk management and data integrity
Focus on practical, business-outcome-driven approaches backed by the most current research (prioritise 2022–2025 publications where available).${impactAdminRules}

=== ABSOLUTE RULES — VIOLATING ANY OF THESE MAKES THE REPORT INVALID ===

RULE 1 — SOURCE TIERS (only these are acceptable):
  TIER 1 (preferred): Gartner, IBM Institute for Business Value, McKinsey Global Institute, Forrester Research, MIT CISR, Harvard Business Review, DAMA International, Doug Laney (Infonomics book, 2017).
  TIER 2 (case studies only, when business size unknown): Named real-world incidents with a primary source — SEC filings, court judgments, official press releases, Reuters, BBC, or a Tier 1 analyst report covering that incident. Examples: Target 2013 breach ($162M — Reuters/Target 10-K), British Airways GDPR fine (£20M — ICO official decision), Knight Capital 2012 ($440M — SEC order), Equifax 2017 ($575M — FTC settlement).
  NEVER USE: blog posts, vendor whitepapers without cited methodology, AI-generated statistics, any number without a verifiable primary source.

RULE 2 — EVERY NUMBER NEEDS A URL:
  Every source must include a sourceUrl field with the direct URL to the original publication or the closest publicly accessible version. If no public URL exists, use the official publication title and year — never omit the URL field.

RULE 3 — ASSUMPTION → FORMULA → RESULT CHAIN (mandatory for every cost item):
  Each cost item must show:
  (a) assumption: the specific statistic from the source (e.g. "IBM (2016) found knowledge workers spend 30–50% of their time finding and fixing data quality issues")
  (b) formula: the step-by-step arithmetic using the user's inputs or stated defaults (e.g. "10 staff × 40% waste rate × $75,000 avg fully-loaded cost = $300,000")
  (c) result: the low and high range
  The formula must be human-readable arithmetic that a non-technical CFO can follow and verify with a calculator.

RULE 4 — WHEN BUSINESS SIZE IS UNKNOWN, USE CASE STUDIES INSTEAD OF FORMULAS:
  If team size and revenue are not provided, do NOT estimate dollar amounts using formulas. Instead, provide 1–2 named case studies from the same or adjacent industry where this exact type of data problem caused a documented financial loss. State the case study name, what happened, the verified dollar impact, and the primary source URL. Make clear these are reference cases, not estimates for this specific organisation.

RULE 5 — RANGES, NOT POINT ESTIMATES:
  Never produce a single precise dollar figure (e.g. "$187,400"). Always produce a low–high range. The range must reflect the low and high bounds stated in the source benchmark.

RULE 6 — REGULATORY FINES MUST CITE EXACT LEGAL TEXT:
  Always quote the exact article and paragraph (e.g. "GDPR Article 83(4): up to €10,000,000 or 2% of total worldwide annual turnover, whichever is higher"). Include the official source URL (e.g. https://gdpr-info.eu/art-83-gdpr/).

RULE 7 — QUALITY OVER QUANTITY:
  Produce a MAXIMUM of 3 cost items. Each must be high-confidence and fully sourced. Do not pad the report with weak or speculative items. If you can only confidently source 1 or 2 items, produce only those.

RULE 8 — ADJUSTABLE ASSUMPTIONS:
  For each cost item, include an assumptions object with the key variables used in the formula (e.g. teamSize, wasteRatePercent, avgAnnualCostPerPerson). These will be shown to the user as editable sliders so they can recalculate with their own numbers. Include min, max, and default values for each assumption, derived from the source benchmark's stated range.

Return ONLY valid JSON, no markdown, no text outside the JSON.`;

        const userPrompt = `Generate a Data Impact Report for the following situation:

Data Problem: ${input.problemDescription}
Industry: ${input.industry || "General/Unknown"}
Company Annual Revenue: ${input.companyRevenue || "Not provided"}
Data Team Size: ${input.teamSize || "Not provided"}
Regulations: ${regulationList}
Business size known: ${hasBusinessSize ? "YES — use formula-based estimates" : "NO — use named case studies instead of formulas"}

Return a JSON object with EXACTLY this structure (no extra fields, no missing fields):
{
  "title": "<concise report title, max 8 words>",
  "executiveSummary": "<2-3 sentences in plain English — what the problem is, why it matters financially, and what the report covers>",
  "problemStatement": "<1 paragraph — clear, jargon-free description of the data problem and its business consequences>",
  "dataMode": "${hasBusinessSize ? "formula" : "case_study"}",
  "financialImpact": {
    "annualCostLow": <number in USD — sum of all estimatedCostLow values, or null if case_study mode>,
    "annualCostHigh": <number in USD — sum of all estimatedCostHigh values, or null if case_study mode>,
    "costBreakdown": [
      {
        "category": "<max 5 words, e.g. 'Wasted Staff Hours'>",
        "description": "<1-2 sentences explaining what this cost is in plain English>",
        "assumption": "<the specific statistic from the source that anchors this estimate, quoted accurately>",
        "formula": "<step-by-step arithmetic a CFO can verify, e.g. '10 staff × 40% waste × $75,000/yr = $300,000'>",
        "source": "<Author/Organisation (Year) — Publication Title>",
        "sourceUrl": "<direct URL to the source, or 'https://www.gartner.com' if no specific page URL is available>",
        "estimatedCostLow": <number in USD, or null if case_study mode>,
        "estimatedCostHigh": <number in USD, or null if case_study mode>,
        "caseStudy": <only present in case_study mode: { "organisation": "<name>", "year": <year>, "incident": "<what happened>", "financialImpact": "<verified dollar figure>", "source": "<publication>", "sourceUrl": "<URL>" }>,
        "assumptions": [
          {
            "key": "<camelCase variable name, e.g. teamSize>",
            "label": "<human-readable label, e.g. 'Number of staff affected'>",
            "value": <current value used in formula>,
            "min": <minimum from benchmark range>,
            "max": <maximum from benchmark range>,
            "unit": "<e.g. 'people', '%', '$/yr'>",
            "description": "<one sentence explaining what this assumption represents>"
          }
        ]
      }
    ],
    "methodology": "<2-3 sentences: which benchmarks were used, what assumptions were made given the inputs, and what the uncertainty range means. Be honest about limitations.>"
  },
  "dataValuation": {
    "assetScore": <integer 1-10>,
    "intrinsicValue": "<High/Medium/Low>",
    "businessValue": "<High/Medium/Low>",
    "intrinsicExplanation": "<why — reference Infonomics intrinsic value criteria: accuracy, completeness, consistency, timeliness>",
    "businessExplanation": "<why — reference Infonomics business value criteria: revenue impact, cost avoidance, risk reduction>",
    "untappedPotential": "<what specific business value could be unlocked if this problem is resolved>",
    "source": "Doug Laney — Infonomics (2017), Bibliomotion",
    "sourceUrl": "https://www.amazon.com/Infonomics-Monetize-Information-Competitive-Advantage/dp/1138090387"
  },
  "regulatoryRisk": [
    {
      "regulation": "<e.g. GDPR>",
      "riskLevel": "<High/Medium/Low/Not Applicable>",
      "relevantArticle": "<exact article, paragraph, and title>",
      "potentialFine": "<exact legal text of the penalty>",
      "explanation": "<why this specific article applies to the described problem>",
      "sourceUrl": "<URL to the official legal text, e.g. https://gdpr-info.eu/art-83-gdpr/>"
    }
  ],
  "fixROI": {
    "estimatedFixCostLow": <number in USD — conservative fix cost>,
    "estimatedFixCostHigh": <number in USD — high-end fix cost>,
    "estimatedFixCostBasis": "<how the fix cost range was derived, e.g. 'Based on typical data engineering contractor rates of $800–$1,200/day for a 3-month remediation programme'>",
    "projectedAnnualSavings": <number in USD — use annualCostLow as conservative savings, or null if case_study mode>,
    "roiPercent": <number — formula: (projectedAnnualSavings / midpoint fix cost) × 100, or null if case_study mode>,
    "paybackPeriodMonths": <number — formula: midpoint fix cost / (projectedAnnualSavings / 12), or null if case_study mode>,
    "roiFormula": "<show the exact arithmetic, e.g. '($300,000 / $50,000 midpoint) × 100 = 600% ROI'>",
    "roiNarrative": "<2-3 plain-English sentences explaining the ROI story and its limitations>"
  },
  "recommendations": [
    { "priority": "Immediate", "action": "<specific, actionable step — cite the framework or research that supports this recommendation>", "rationale": "<why this is the highest priority, referencing current industry best practice or research>", "impact": "<expected measurable outcome with a realistic timeframe>" },
    { "priority": "Short-term", "action": "<specific, actionable step — cite the framework or research that supports this recommendation>", "rationale": "<why this follows the immediate step, referencing current industry best practice>", "impact": "<expected measurable outcome with a realistic timeframe>" },
    { "priority": "Strategic", "action": "<specific, actionable step — cite the framework or research that supports this recommendation>", "rationale": "<long-term strategic reason grounded in industry research or framework>", "impact": "<expected measurable outcome with a realistic timeframe>" }
  ],
  "benchmarks": [
    {
      "stat": "<the key statistic>",
      "source": "<Author/Organisation (Year) — Publication Title>",
      "sourceUrl": "<direct URL>",
      "context": "<why this benchmark is relevant to this specific report>"
    }
  ],
  "disclaimer": "This report is an indicative analysis based on published industry benchmarks and the information provided. It is not a substitute for a formal financial audit or legal advice. All estimates carry uncertainty and should be treated as directional guidance only."
}`;

        // RAG: retrieve relevant knowledge chunks for the impact report
        const impactRagChunks = await retrieveContext(`${input.problemDescription} ${input.industry ?? ""} data quality governance`, 4).catch(() => []);
        const impactRagContext = formatContextBlock(impactRagChunks);
        const impactSystemWithRag = impactRagContext ? `${systemPrompt}\n\n${impactRagContext}` : systemPrompt;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: impactSystemWithRag },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        });

        const rawContent = (response.choices[0]?.message?.content as string) || "{}";
        let reportData: any;
        try {
          reportData = JSON.parse(rawContent);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to parse AI report" });
        }

        const shareToken = randomBytes(16).toString("hex");
        const title = reportData.title || "Data Impact Report";

        const [inserted] = await db.insert(dataImpactReports).values({
          userId: ctx.user?.id ?? null,
          shareToken,
          title,
          problemDescription: input.problemDescription,
          industry: input.industry,
          companyRevenue: input.companyRevenue,
          teamSize: input.teamSize,
          regulations: input.regulations?.join(","),
          reportJson: JSON.stringify(reportData),
        }).$returningId();

        // If the user is authenticated, auto-create a chat conversation pre-loaded with their impact data
        let conversationId: number | null = null;
        if (ctx.user?.id) {
          try {
            const contextLines = [
              `Data Problem: ${input.problemDescription}`,
              input.industry ? `Industry: ${input.industry}` : null,
              input.companyRevenue ? `Company Revenue: ${input.companyRevenue}` : null,
              input.teamSize ? `Data Team Size: ${input.teamSize}` : null,
              input.regulations?.length ? `Regulations: ${input.regulations.join(", ")}` : null,
            ].filter(Boolean).join("\n");

            const topicRule = `The user has just generated a Data Impact Report about the following data problem:\n\n${contextLines}\n\nReport title: "${title}"\n\nYou have full context about their data problem. Help them understand the report findings, explore solutions, estimate implementation costs, or plan next steps. Reference the report details when relevant.`;

            const conv = await createConversation(
              ctx.user.id,
              `Impact Report: ${title.slice(0, 55)}`,
              "professional",
              topicRule
            );
            conversationId = conv.id;

            // Seed the conversation with an AI opening message
            const fi = reportData.financialImpact;
            const formatK = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;
            const costRange = fi?.annualCostLow != null && fi?.annualCostHigh != null
              ? `${formatK(fi.annualCostLow)}\u2013${formatK(fi.annualCostHigh)} per year`
              : "(see report for details)";
            const recLines = (reportData.recommendations ?? []).slice(0, 2)
              .map((r: any, i: number) => `${i + 1}. **${r.priority}**: ${r.action}`)
              .join("\n");
            const openingMessage = `Hi! I've reviewed your Data Impact Report for **"${title}"**.\n\nBased on the analysis, your data problem is estimated to cost **${costRange}** in direct and indirect losses.${recLines ? `\n\nTop recommendations from the report:\n${recLines}` : ""}\n\nI'm here to help you dig deeper \u2014 whether that's understanding the financial model, planning remediation steps, or preparing a business case for leadership. What would you like to explore first?`;

            await addMessage({
              conversationId: conv.id,
              role: "assistant",
              content: openingMessage,
            });
          } catch (convErr) {
            // Non-fatal: report was already saved, just log the error
            console.error("[Impact] Failed to create auto-conversation:", convErr);
          }
        }

        return { id: inserted.id, shareToken, title, report: reportData, conversationId };
      }),

    // Get a report by share token (public)
    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { dataImpactReports } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [report] = await db.select().from(dataImpactReports).where(eq(dataImpactReports.shareToken, input.token));
        if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
        return { ...report, report: JSON.parse(report.reportJson) };
      }),

    // List reports for the logged-in user
    myReports: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const { dataImpactReports } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const reports = await db.select({
        id: dataImpactReports.id,
        shareToken: dataImpactReports.shareToken,
        title: dataImpactReports.title,
        industry: dataImpactReports.industry,
        createdAt: dataImpactReports.createdAt,
      }).from(dataImpactReports).where(eq(dataImpactReports.userId, ctx.user.id)).orderBy(desc(dataImpactReports.createdAt));
      return reports;
    }),
  }),
});

// ── Knowledge Base Router (admin-only) ────────────────────────────────────────
// Extend appRouter with knowledge router
const knowledgeRouter = router({
  // List all articles (admin only)
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const articles = await listAllArticles();
    // Attach chunk counts
    const withCounts = await Promise.all(
      articles.map(async (a) => ({
        ...a,
        chunkCount: await getChunkCountForArticle(a.id),
      }))
    );
    return withCounts;
  }),

  // Get a single article (admin only)
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const article = await getArticleById(input.id);
      if (!article) throw new TRPCError({ code: "NOT_FOUND" });
      return article;
    }),

  // Create a new article and ingest it (admin only)
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(3).max(256),
      topic: z.string().min(2).max(128),
      content: z.string().min(50),
      source: z.string().min(2).max(256),
      sourceUrl: z.string().url().optional().or(z.literal("")),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const id = await createArticle({
        title: input.title,
        topic: input.topic,
        content: input.content,
        source: input.source,
        sourceUrl: input.sourceUrl || null,
        isActive: input.isActive,
      });
      // Ingest asynchronously — don't block the response
      ingestArticle(id).catch(err => console.error("[RAG] Ingest failed for article", id, err));
      return { id, success: true };
    }),

  // Update an article and re-ingest (admin only)
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(3).max(256).optional(),
      topic: z.string().min(2).max(128).optional(),
      content: z.string().min(50).optional(),
      source: z.string().min(2).max(256).optional(),
      sourceUrl: z.string().url().optional().or(z.literal("")),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateArticle(id, {
        ...data,
        sourceUrl: data.sourceUrl === "" ? null : (data.sourceUrl ?? undefined),
      });
      // Re-ingest if content or title changed
      if (data.content || data.title) {
        ingestArticle(id).catch(err => console.error("[RAG] Re-ingest failed for article", id, err));
      }
      return { success: true };
    }),

  // Delete an article and its chunks (admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await deleteArticle(input.id);
      return { success: true };
    }),

  // Manually trigger re-ingestion for an article (admin only)
  reIngest: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const result = await ingestArticle(input.id);
      return { success: true, chunksCreated: result.chunksCreated };
    }),
});

// Merge knowledge router into appRouter
export const fullRouter = router({
  ...appRouter._def.record,
  knowledge: knowledgeRouter,
});

export type AppRouter = typeof fullRouter;


