import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db helpers
vi.mock("./db", () => ({
  createTestimonial: vi.fn().mockResolvedValue(undefined),
  getApprovedTestimonials: vi.fn().mockResolvedValue([
    { id: 1, name: "Alice", role: "CTO", company: "Acme", content: "Great work!", isAnonymous: false, approved: true, createdAt: new Date() },
  ]),
  getAllTestimonials: vi.fn().mockResolvedValue([
    { id: 1, name: "Alice", role: "CTO", company: "Acme", content: "Great work!", isAnonymous: false, approved: true, createdAt: new Date() },
    { id: 2, name: null, role: null, company: null, content: "Amazing architect!", isAnonymous: true, approved: false, createdAt: new Date() },
  ]),
  approveTestimonial: vi.fn().mockResolvedValue(undefined),
  deleteTestimonial: vi.fn().mockResolvedValue(undefined),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function makeCtx(role: "user" | "admin" | null = null): TrpcContext {
  const user = role
    ? {
        id: 1,
        openId: "test-user",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "manus",
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("testimonials.list", () => {
  it("returns approved testimonials for public users", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.testimonials.list();
    expect(result).toHaveLength(1);
    expect(result[0].approved).toBe(true);
  });
});

describe("testimonials.submit", () => {
  it("submits a named testimonial", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.testimonials.submit({
      name: "Bob",
      role: "Engineer",
      company: "TechCo",
      content: "Ayah helped us reduce our costs significantly.",
      isAnonymous: false,
    });
    expect(result.success).toBe(true);
  });

  it("submits an anonymous testimonial", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.testimonials.submit({
      content: "Really insightful consultation session.",
      isAnonymous: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects content shorter than 10 characters", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.testimonials.submit({ content: "Short", isAnonymous: false })
    ).rejects.toThrow();
  });
});

describe("testimonials.adminList", () => {
  it("returns all testimonials for admin", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.testimonials.adminList();
    expect(result).toHaveLength(2);
  });

  it("throws for non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.testimonials.adminList()).rejects.toThrow();
  });
});

describe("testimonials.approve", () => {
  it("allows admin to approve a testimonial", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.testimonials.approve({ id: 2 });
    expect(result.success).toBe(true);
  });

  it("throws for non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.testimonials.approve({ id: 2 })).rejects.toThrow();
  });
});

describe("testimonials.delete", () => {
  it("allows admin to delete a testimonial", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.testimonials.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("throws for non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.testimonials.delete({ id: 1 })).rejects.toThrow();
  });
});
