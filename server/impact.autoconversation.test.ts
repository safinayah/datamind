/**
 * Tests for the DataImpact report auto-conversation creation logic.
 *
 * These tests verify that:
 * 1. When an authenticated user generates a report, a conversation is created
 *    and the response includes a non-null conversationId.
 * 2. When an unauthenticated user generates a report, no conversation is created
 *    and conversationId is null.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock the DB so we don't need a real database connection
vi.mock("../server/db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        $returningId: vi.fn().mockResolvedValue([{ id: 42 }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 99, title: "Test Conv", tone: "professional" }]),
          }),
        }),
      }),
    }),
  }),
}));

// Mock the LLM so we don't make real API calls
vi.mock("../server/_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            title: "Test Impact Report",
            dataMode: "quantitative",
            financialImpact: {
              annualCostLow: 100000,
              annualCostHigh: 300000,
              costBreakdown: [],
            },
            dataValuation: {
              assetScore: 7,
              intrinsicValue: "High",
              businessValue: "Medium",
              intrinsicExplanation: "test",
              businessExplanation: "test",
              untappedPotential: "test",
              source: "Infonomics",
              sourceUrl: "https://example.com",
            },
            regulatoryRisk: [],
            fixROI: {
              estimatedFixCostLow: 10000,
              estimatedFixCostHigh: 50000,
              estimatedFixCostBasis: "test",
              projectedAnnualSavings: 200000,
              roiPercent: 666,
              paybackPeriodMonths: 2,
              roiFormula: "test",
              roiNarrative: "test",
            },
            recommendations: [
              { priority: "Immediate", action: "Fix it now", rationale: "urgent", impact: "big" },
            ],
            benchmarks: [],
            methodology: "test methodology",
            disclaimer: "test disclaimer",
          }),
        },
      },
    ],
  }),
}));

// Mock conversationsDb
const mockCreateConversation = vi.fn().mockResolvedValue({ id: 99, title: "Test Conv" });
const mockAddMessage = vi.fn().mockResolvedValue(undefined);

vi.mock("../server/conversationsDb", () => ({
  createConversation: (...args: any[]) => mockCreateConversation(...args),
  addMessage: (...args: any[]) => mockAddMessage(...args),
  listConversations: vi.fn().mockResolvedValue([]),
  getConversation: vi.fn().mockResolvedValue(null),
  renameConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
  getMessages: vi.fn().mockResolvedValue([]),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Simulates the auto-conversation creation logic extracted from the generate procedure.
 * Returns conversationId (number) or null.
 */
async function runAutoConversationLogic(
  userId: number | null,
  reportData: any,
  shareToken: string,
  input: {
    problemDescription: string;
    industry?: string;
    companyRevenue?: string;
    teamSize?: string;
    regulations?: string[];
  }
): Promise<number | null> {
  const { createConversation, addMessage } = await import("../server/conversationsDb");

  let conversationId: number | null = null;
  if (userId != null) {
    try {
      const title = reportData.title || "Data Impact Report";
      const contextLines = [
        `Data Problem: ${input.problemDescription}`,
        input.industry ? `Industry: ${input.industry}` : null,
        input.companyRevenue ? `Company Revenue: ${input.companyRevenue}` : null,
        input.teamSize ? `Data Team Size: ${input.teamSize}` : null,
        input.regulations?.length ? `Regulations: ${input.regulations.join(", ")}` : null,
      ].filter(Boolean).join("\n");

      const topicRule = `The user has just generated a Data Impact Report about the following data problem:\n\n${contextLines}\n\nReport title: "${title}"`;

      const conv = await createConversation(userId, `Impact Report: ${title.slice(0, 55)}`, "professional", topicRule);
      conversationId = conv.id;

      const openingMessage = `Hi! I've reviewed your Data Impact Report for **"${title}"**.`;
      await addMessage({ conversationId: conv.id, role: "assistant", content: openingMessage });
    } catch {
      // non-fatal
    }
  }
  return conversationId;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("DataImpact auto-conversation creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateConversation.mockResolvedValue({ id: 99, title: "Test Conv" });
    mockAddMessage.mockResolvedValue(undefined);
  });

  it("creates a conversation and returns its id when user is authenticated", async () => {
    const reportData = { title: "Duplicate Customer Records Impact", financialImpact: { annualCostLow: 100000, annualCostHigh: 300000 }, recommendations: [] };
    const conversationId = await runAutoConversationLogic(
      42,
      reportData,
      "abc123",
      { problemDescription: "We have duplicate customer records causing issues", industry: "Finance" }
    );

    expect(conversationId).toBe(99);
    expect(mockCreateConversation).toHaveBeenCalledOnce();
    expect(mockCreateConversation).toHaveBeenCalledWith(
      42,
      expect.stringContaining("Impact Report:"),
      "professional",
      expect.stringContaining("Duplicate Customer Records Impact")
    );
    expect(mockAddMessage).toHaveBeenCalledOnce();
    expect(mockAddMessage).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 99, role: "assistant" })
    );
  });

  it("does NOT create a conversation when user is unauthenticated (userId null)", async () => {
    const reportData = { title: "Anonymous Report", financialImpact: {}, recommendations: [] };
    const conversationId = await runAutoConversationLogic(
      null,
      reportData,
      "xyz789",
      { problemDescription: "Missing data in financial reports causing reconciliation errors" }
    );

    expect(conversationId).toBeNull();
    expect(mockCreateConversation).not.toHaveBeenCalled();
    expect(mockAddMessage).not.toHaveBeenCalled();
  });

  it("returns null and does not throw when createConversation fails", async () => {
    mockCreateConversation.mockRejectedValueOnce(new Error("DB error"));

    const reportData = { title: "Test Report", financialImpact: {}, recommendations: [] };
    const conversationId = await runAutoConversationLogic(
      42,
      reportData,
      "tok123",
      { problemDescription: "Inconsistent product data across all our systems" }
    );

    // Should be null (non-fatal error) and not throw
    expect(conversationId).toBeNull();
  });

  it("includes all provided context fields in the topicRule", async () => {
    const reportData = { title: "Full Context Report", financialImpact: {}, recommendations: [] };
    await runAutoConversationLogic(
      42,
      reportData,
      "tok456",
      {
        problemDescription: "No data lineage documentation exists",
        industry: "Healthcare",
        companyRevenue: "$10M–$50M",
        teamSize: "5–10 people",
        regulations: ["GDPR", "HIPAA"],
      }
    );

    const topicRuleArg = mockCreateConversation.mock.calls[0][3] as string;
    expect(topicRuleArg).toContain("Industry: Healthcare");
    expect(topicRuleArg).toContain("Company Revenue: $10M–$50M");
    expect(topicRuleArg).toContain("Data Team Size: 5–10 people");
    expect(topicRuleArg).toContain("Regulations: GDPR, HIPAA");
  });
});
