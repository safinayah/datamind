import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock the DB layer so tests don't need a real database ─────────────────────
const mockDb = {
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
};

vi.mock("./db", () => ({
  getDb: vi.fn(() => mockDb),
}));

vi.mock("../drizzle/schema", () => ({
  conversations: { id: "id", userId: "userId", tone: "tone", updatedAt: "updatedAt" },
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
}));

// ── Import after mocks are set up ─────────────────────────────────────────────
import { updateConversationTone } from "./conversationsDb";

describe("updateConversationTone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chain so each test gets a fresh mock
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.where.mockResolvedValue(undefined);
  });

  it("calls db.update with the correct tone value", async () => {
    await updateConversationTone(1, 42, "technical");
    expect(mockDb.update).toHaveBeenCalledTimes(1);
    expect(mockDb.set).toHaveBeenCalledTimes(1);
    const setArgs = mockDb.set.mock.calls[0][0];
    expect(setArgs.tone).toBe("technical");
  });

  it("accepts all three valid tone values", async () => {
    const tones = ["professional", "conversational", "technical"] as const;
    for (const tone of tones) {
      vi.clearAllMocks();
      mockDb.update.mockReturnThis();
      mockDb.set.mockReturnThis();
      mockDb.where.mockResolvedValue(undefined);
      await updateConversationTone(1, 1, tone);
      const setArgs = mockDb.set.mock.calls[0][0];
      expect(setArgs.tone).toBe(tone);
    }
  });

  it("only sets the tone field (no extra fields in payload)", async () => {
    await updateConversationTone(5, 10, "professional");
    const setArgs = mockDb.set.mock.calls[0][0];
    expect(Object.keys(setArgs)).toEqual(["tone"]);
  });

  it("calls where to scope the update to the correct conversation and user", async () => {
    await updateConversationTone(7, 99, "conversational");
    expect(mockDb.where).toHaveBeenCalledTimes(1);
  });
});
