import { describe, it, expect } from "vitest";

/**
 * Mirrors the parseChoices helper defined in client/src/pages/Chat.tsx.
 * Kept here as a pure-logic unit test (no DOM/React needed).
 */
function parseChoices(content: string): string[] {
  const lines = content.split("\n");
  const choices: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match: "1. Option text", "A. Option text", "1) Option text", "A) Option text"
    const match = trimmed.match(/^([A-Za-z]|\d+)[.)]\s+(.+)$/);
    if (match) {
      const text = match[2].trim();
      if (text.length > 0 && text.length < 120) {
        choices.push(text);
      }
    }
  }

  // Only return choices if there are 2–6 of them (heuristic: a real question with options)
  return choices.length >= 2 && choices.length <= 6 ? choices : [];
}

describe("parseChoices", () => {
  it("parses numbered options (1. 2. 3.)", () => {
    const content = `What is your main challenge?

1. Data quality issues
2. Lack of governance
3. No clear ownership
4. All of the above`;
    const result = parseChoices(content);
    expect(result).toEqual([
      "Data quality issues",
      "Lack of governance",
      "No clear ownership",
      "All of the above",
    ]);
  });

  it("parses lettered options (A. B. C.)", () => {
    const content = `Which industry are you in?

A. Financial services
B. Healthcare
C. Retail
D. Technology`;
    const result = parseChoices(content);
    expect(result).toEqual([
      "Financial services",
      "Healthcare",
      "Retail",
      "Technology",
    ]);
  });

  it("parses options with parentheses (1) 2) A) B))", () => {
    const content = `How mature is your data governance?

1) Ad-hoc, no formal process
2) Some policies but not enforced
3) Formal governance in place`;
    const result = parseChoices(content);
    expect(result).toEqual([
      "Ad-hoc, no formal process",
      "Some policies but not enforced",
      "Formal governance in place",
    ]);
  });

  it("returns empty array when only 1 option (not a real question)", () => {
    const content = `Here is the answer:

1. Just one option`;
    expect(parseChoices(content)).toEqual([]);
  });

  it("returns empty array when more than 6 options (not a simple question)", () => {
    const content = `1. Option one
2. Option two
3. Option three
4. Option four
5. Option five
6. Option six
7. Option seven`;
    expect(parseChoices(content)).toEqual([]);
  });

  it("returns empty array for plain prose with no numbered list", () => {
    const content = `Data governance is the process of managing data availability, usability, integrity, and security in enterprise systems. It involves policies, standards, and processes to ensure data is consistent and trustworthy.`;
    expect(parseChoices(content)).toEqual([]);
  });

  it("ignores options with text longer than 120 characters", () => {
    const longText = "A".repeat(121);
    const content = `1. Short option
2. ${longText}
3. Another short option`;
    const result = parseChoices(content);
    // Only 2 valid options remain, so it should return them
    expect(result).toEqual(["Short option", "Another short option"]);
  });
});
