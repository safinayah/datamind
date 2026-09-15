import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the DB helpers
vi.mock("./chatDb", () => ({
  getOrCreateSession: vi.fn().mockResolvedValue({
    sessionId: "test-session-123",
    tone: "conversational",
    freeMessagesUsed: 0,
    createdAt: new Date(),
  }),
  canSendMessage: vi.fn().mockResolvedValue({ allowed: true, remaining: 4 }),
  incrementFreeMessages: vi.fn().mockResolvedValue(undefined),
  saveMessage: vi.fn().mockResolvedValue(undefined),
  getSessionMessages: vi.fn().mockResolvedValue([]),
  getActiveRules: vi.fn().mockResolvedValue([]),
  getAllRules: vi.fn().mockResolvedValue([]),
  createRule: vi.fn().mockResolvedValue(undefined),
  updateRule: vi.fn().mockResolvedValue(undefined),
  deleteRule: vi.fn().mockResolvedValue(undefined),
  getAllSessions: vi.fn().mockResolvedValue([]),
  getMessagesForSession: vi.fn().mockResolvedValue([]),
  FREE_MESSAGE_LIMIT: 5,
}));

vi.mock("./ayahPrompt", () => ({
  buildSystemPrompt: vi.fn().mockResolvedValue("You are Ayah's assistant."),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Hello! I'm Ayah's assistant." } }],
  }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./db", () => ({
  createTestimonial: vi.fn().mockResolvedValue(undefined),
  getApprovedTestimonials: vi.fn().mockResolvedValue([]),
  getAllTestimonials: vi.fn().mockResolvedValue([]),
  approveTestimonial: vi.fn().mockResolvedValue(undefined),
  deleteTestimonial: vi.fn().mockResolvedValue(undefined),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      name: "Ayah Safin",
      email: "ayah.safeen@gmail.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("chat.startSession", () => {
  it("returns session and status for a new session", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.chat.startSession({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      tone: "conversational",
    });
    expect(result).toHaveProperty("session");
    expect(result).toHaveProperty("allowed");
    expect(result.freeLimit).toBe(5);
  });
});

describe("chat.send", () => {
  it("returns a reply when limit is not reached", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.chat.send({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      message: "Tell me about Ayah's experience",
    });
    expect(result.success).toBe(true);
    expect(result.limitReached).toBe(false);
    expect(typeof result.reply).toBe("string");
  });

  it("returns a successful reply for a second message", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.chat.send({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      message: "Another message",
    });
    expect(result.success).toBe(true);
    expect(result.limitReached).toBe(false);
  });
});

describe("admin.listRules", () => {
  it("returns rules for admin user", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.listRules();
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws for non-admin user", async () => {
    const ctx = makeAdminCtx();
    ctx.user!.role = "user";
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listRules()).rejects.toThrow();
  });
});

describe("admin.createRule", () => {
  it("creates a rule for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.createRule({
      title: "Availability",
      rule: "If asked about availability, say I am open for consultations.",
      isActive: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("chat.status", () => {
  it("returns session status", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.chat.status({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result).toHaveProperty("allowed");
    expect(result).toHaveProperty("remaining");
    expect(result.freeLimit).toBe(5);
  });
});
