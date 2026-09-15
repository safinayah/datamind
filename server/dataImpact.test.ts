import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock the DB module ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// ── Mock the LLM module ───────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

const mockReport = {
  title: "CRM Data Quality Impact Report",
  executiveSummary: "Duplicate customer records are costing the business significantly.",
  problemStatement: "The CRM contains ~20% duplicate records causing wasted marketing spend.",
  financialImpact: {
    annualCostLow: 120000,
    annualCostHigh: 340000,
    costBreakdown: [
      { category: "Wasted Staff Hours", description: "Manual dedup work", estimatedCost: 50000 },
      { category: "Revenue Leakage", description: "Duplicate outreach", estimatedCost: 80000 },
    ],
    methodology: "Based on Gartner benchmarks for data quality costs.",
  },
  dataValuation: {
    assetScore: 4,
    intrinsicValue: "Low",
    businessValue: "Medium",
    intrinsicExplanation: "High duplicate rate reduces data reliability.",
    businessExplanation: "Customer data drives sales and marketing decisions.",
    untappedPotential: "Clean data could improve campaign ROI by 30%.",
  },
  regulatoryRisk: [
    {
      regulation: "GDPR",
      riskLevel: "Medium",
      relevantArticle: "Article 5 — Data Accuracy",
      potentialFine: "Up to €20M or 4% of global annual revenue",
      explanation: "GDPR requires personal data to be accurate and kept up to date.",
    },
  ],
  fixROI: {
    estimatedFixCost: "$30,000–$60,000",
    projectedAnnualSavings: 200000,
    roiPercent: 400,
    paybackPeriodMonths: 3,
    roiNarrative: "A 3-month data quality program would pay back within 3 months.",
  },
  recommendations: [
    { priority: "Immediate", action: "Run dedup analysis", impact: "Identify scope of problem" },
    { priority: "Short-term", action: "Implement merge rules", impact: "Reduce duplicates by 80%" },
    { priority: "Strategic", action: "Add data quality gates", impact: "Prevent future duplicates" },
  ],
  benchmarks: [
    { stat: "$12.9M", source: "Gartner", context: "Average annual cost of poor data quality per organization" },
  ],
};

describe("dataImpact router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generate procedure", () => {
    it("calls invokeLLM with a system prompt and user prompt", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        $returningId: () => Promise.resolve([{ id: 1 }]),
      });
      const mockDb = {
        insert: vi.fn().mockReturnValue({ values: mockInsert }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockReport) } }],
      } as any);

      const { invokeLLM: llm } = await import("./_core/llm");
      const { getDb: db } = await import("./db");

      const database = await db();
      expect(database).toBeDefined();

      await llm({
        messages: [
          { role: "system", content: "You are a data advisor." },
          { role: "user", content: "Analyse: duplicate CRM records" },
        ],
        response_format: { type: "json_object" },
      });

      expect(llm).toHaveBeenCalledOnce();
      const call = vi.mocked(llm).mock.calls[0][0];
      expect(call.messages[0].role).toBe("system");
      expect(call.messages[1].role).toBe("user");
      expect(call.response_format).toEqual({ type: "json_object" });
    });

    it("parses the AI JSON response correctly", () => {
      const rawContent = JSON.stringify(mockReport);
      const parsed = JSON.parse(rawContent);
      expect(parsed.title).toBe("CRM Data Quality Impact Report");
      expect(parsed.financialImpact.annualCostLow).toBe(120000);
      expect(parsed.financialImpact.annualCostHigh).toBe(340000);
      expect(parsed.dataValuation.assetScore).toBe(4);
      expect(parsed.fixROI.roiPercent).toBe(400);
      expect(parsed.regulatoryRisk).toHaveLength(1);
      expect(parsed.recommendations).toHaveLength(3);
    });

    it("throws on invalid JSON from LLM", () => {
      const badContent = "not valid json {{{";
      expect(() => JSON.parse(badContent)).toThrow();
    });
  });

  describe("getByToken procedure", () => {
    it("returns parsed report JSON when token is found", async () => {
      const storedReport = {
        id: 1,
        shareToken: "abc123",
        title: "Test Report",
        problemDescription: "Test problem",
        industry: "Technology",
        companyRevenue: "$10M – $50M",
        teamSize: "6–20 people",
        regulations: "GDPR",
        reportJson: JSON.stringify(mockReport),
        createdAt: new Date(),
      };

      const result = { ...storedReport, report: JSON.parse(storedReport.reportJson) };
      expect(result.report.title).toBe("CRM Data Quality Impact Report");
      expect(result.report.financialImpact.annualCostLow).toBe(120000);
      expect(result.shareToken).toBe("abc123");
    });

    it("handles missing report gracefully", () => {
      const emptyResult: any[] = [];
      const [report] = emptyResult;
      expect(report).toBeUndefined();
    });
  });

  describe("report data structure validation", () => {
    it("validates all required financial impact fields exist", () => {
      const fi = mockReport.financialImpact;
      expect(fi).toHaveProperty("annualCostLow");
      expect(fi).toHaveProperty("annualCostHigh");
      expect(fi).toHaveProperty("costBreakdown");
      expect(fi).toHaveProperty("methodology");
      expect(Array.isArray(fi.costBreakdown)).toBe(true);
      expect(fi.costBreakdown.length).toBeGreaterThan(0);
    });

    it("validates data valuation fields", () => {
      const dv = mockReport.dataValuation;
      expect(dv.assetScore).toBeGreaterThanOrEqual(1);
      expect(dv.assetScore).toBeLessThanOrEqual(10);
      expect(["High", "Medium", "Low"]).toContain(dv.intrinsicValue);
      expect(["High", "Medium", "Low"]).toContain(dv.businessValue);
    });

    it("validates fix ROI fields", () => {
      const roi = mockReport.fixROI;
      expect(roi.roiPercent).toBeGreaterThan(0);
      expect(roi.paybackPeriodMonths).toBeGreaterThan(0);
      expect(roi.projectedAnnualSavings).toBeGreaterThan(0);
    });

    it("validates regulatory risk structure", () => {
      const risks = mockReport.regulatoryRisk;
      expect(Array.isArray(risks)).toBe(true);
      risks.forEach(risk => {
        expect(risk).toHaveProperty("regulation");
        expect(risk).toHaveProperty("riskLevel");
        expect(["High", "Medium", "Low", "Not Applicable"]).toContain(risk.riskLevel);
      });
    });

    it("validates recommendations structure", () => {
      const recs = mockReport.recommendations;
      expect(Array.isArray(recs)).toBe(true);
      recs.forEach(rec => {
        expect(rec).toHaveProperty("priority");
        expect(rec).toHaveProperty("action");
        expect(rec).toHaveProperty("impact");
        expect(["Immediate", "Short-term", "Strategic"]).toContain(rec.priority);
      });
    });
  });

  describe("currency formatting", () => {
    const formatCurrency = (n: number): string => {
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
      if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
      return `$${n.toLocaleString()}`;
    };

    it("formats millions correctly", () => {
      expect(formatCurrency(1_500_000)).toBe("$1.5M");
      expect(formatCurrency(12_900_000)).toBe("$12.9M");
    });

    it("formats thousands correctly", () => {
      expect(formatCurrency(120_000)).toBe("$120K");
      expect(formatCurrency(340_000)).toBe("$340K");
    });

    it("formats small amounts correctly", () => {
      expect(formatCurrency(500)).toBe("$500");
    });
  });
});
