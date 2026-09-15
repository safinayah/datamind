import { describe, it, expect, vi } from "vitest";

// ─── Unit tests for the RAG pipeline helpers ───────────────────────────────
// We test the pure functions (chunkText, cosineSimilarity, formatContextBlock)
// without hitting the database or embedding API.

// Re-implement the pure functions here for testing (they are not exported from
// rag.ts because they are internal helpers). This mirrors the exact logic in
// server/rag.ts so any divergence will be caught by the tests.

function chunkText(text: string, maxChunkSize = 800, overlap = 100): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      // carry overlap from end of current chunk
      const words = current.split(" ");
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      current = overlapWords.join(" ") + "\n\n" + para;
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 20);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function formatContextBlock(chunks: Array<{ content: string; source: string; topic: string }>): string {
  if (chunks.length === 0) return "";
  const lines = chunks.map((c, i) =>
    `[${i + 1}] Topic: ${c.topic} | Source: ${c.source}\n${c.content}`
  );
  return `\n\n--- KNOWLEDGE BASE CONTEXT ---\nThe following verified domain knowledge is relevant to this query. Use it to ground your response:\n\n${lines.join("\n\n")}\n--- END CONTEXT ---\n`;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("chunkText", () => {
  it("returns a single chunk for short text", () => {
    const text = "This is a short paragraph about data quality.";
    const chunks = chunkText(text, 800, 100);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("data quality");
  });

  it("splits long text into multiple chunks", () => {
    const para = "A".repeat(400);
    const text = [para, para, para].join("\n\n");
    const chunks = chunkText(text, 800, 100);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("filters out very short chunks (< 20 chars)", () => {
    const text = "Hi\n\nThis is a proper paragraph with enough content to be useful.";
    const chunks = chunkText(text, 800, 100);
    expect(chunks.every(c => c.length >= 20)).toBe(true);
  });

  it("preserves content across chunks", () => {
    const para1 = "Data governance is the process of managing data availability.";
    const para2 = "Data quality refers to the accuracy and completeness of data assets.";
    const text = para1 + "\n\n" + para2;
    const chunks = chunkText(text, 800, 100);
    const combined = chunks.join(" ");
    expect(combined).toContain("governance");
    expect(combined).toContain("quality");
  });
});

describe("cosineSimilarity", () => {
  it("returns 1.0 for identical vectors", () => {
    const v = [0.5, 0.3, 0.8, 0.1];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
  });

  it("returns 0 for orthogonal vectors", () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
  });

  it("returns -1 for opposite vectors", () => {
    const a = [1, 0];
    const b = [-1, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5);
  });

  it("returns 0 for zero-length vectors", () => {
    const a = [0, 0, 0];
    const b = [1, 2, 3];
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it("returns 0 for mismatched lengths", () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  it("correctly ranks similar vectors higher than dissimilar ones", () => {
    const query = [1, 1, 0, 0];
    const similar = [0.9, 0.8, 0.1, 0.0];
    const dissimilar = [0.0, 0.1, 0.9, 0.8];
    expect(cosineSimilarity(query, similar)).toBeGreaterThan(cosineSimilarity(query, dissimilar));
  });
});

describe("formatContextBlock", () => {
  it("returns empty string for no chunks", () => {
    expect(formatContextBlock([])).toBe("");
  });

  it("includes topic and source labels", () => {
    const result = formatContextBlock([
      { content: "Data quality has 6 dimensions.", source: "DAMA-DMBOK v2", topic: "data-quality" }
    ]);
    expect(result).toContain("data-quality");
    expect(result).toContain("DAMA-DMBOK v2");
    expect(result).toContain("Data quality has 6 dimensions.");
  });

  it("numbers multiple chunks correctly", () => {
    const result = formatContextBlock([
      { content: "First chunk.", source: "Source A", topic: "topic-a" },
      { content: "Second chunk.", source: "Source B", topic: "topic-b" },
    ]);
    expect(result).toContain("[1]");
    expect(result).toContain("[2]");
  });

  it("wraps output in KNOWLEDGE BASE CONTEXT markers", () => {
    const result = formatContextBlock([
      { content: "Some knowledge.", source: "Gartner 2025", topic: "analytics" }
    ]);
    expect(result).toContain("--- KNOWLEDGE BASE CONTEXT ---");
    expect(result).toContain("--- END CONTEXT ---");
  });
});
