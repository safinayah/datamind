/**
 * RAG (Retrieval-Augmented Generation) Pipeline
 *
 * Retrieval strategy: BM25 keyword scoring (primary) + hash-embedding cosine similarity (secondary).
 * BM25 is highly effective for domain-specific technical content where exact term matches
 * (e.g., "DAMA-DMBOK", "DCAM", "ETL", "data quality") are more important than semantic similarity.
 *
 * Public API:
 *   ingestArticle(articleId)    — chunk an article and store in DB
 *   retrieveContext(query, topK) — find the most relevant chunks for a query
 *   formatContextBlock(chunks)  — format retrieved chunks for system prompt injection
 */

import { getDb } from "./db";
import { knowledgeArticles, knowledgeChunks } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Chunking ────────────────────────────────────────────────────────────────

const CHUNK_SIZE_WORDS = 120;  // ~400 tokens at 3.3 words/token
const CHUNK_OVERLAP_WORDS = 20;

/**
 * Split a text into overlapping word-based chunks.
 */
export function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE_WORDS, words.length);
    const chunk = words.slice(start, end).join(" ");
    if (chunk.length > 20) chunks.push(chunk);
    if (end >= words.length) break;
    start = end - CHUNK_OVERLAP_WORDS;
  }

  return chunks;
}

// ─── BM25 Scoring ────────────────────────────────────────────────────────────

const BM25_K1 = 1.5;
const BM25_B = 0.75;

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 1);
}

interface BM25Corpus {
  docs: string[][];          // tokenised documents
  idf: Map<string, number>;  // IDF for each term
  avgDocLen: number;
}

function buildBM25Corpus(texts: string[]): BM25Corpus {
  const docs = texts.map(tokenise);
  const N = docs.length;
  const df = new Map<string, number>();

  for (const doc of docs) {
    const seen = new Set(doc);
    Array.from(seen).forEach(term => {
      df.set(term, (df.get(term) ?? 0) + 1);
    });
  }

  const idf = new Map<string, number>();
  Array.from(df.entries()).forEach(([term, freq]) => {
    idf.set(term, Math.log((N - freq + 0.5) / (freq + 0.5) + 1));
  });

  const avgDocLen = docs.reduce((s, d) => s + d.length, 0) / (N || 1);

  return { docs, idf, avgDocLen };
}

function bm25Score(queryTokens: string[], docTokens: string[], corpus: BM25Corpus): number {
  const docLen = docTokens.length;
  const tf = new Map<string, number>();
  for (const t of docTokens) tf.set(t, (tf.get(t) ?? 0) + 1);

  let score = 0;
  for (const term of queryTokens) {
    const termFreq = tf.get(term) ?? 0;
    if (termFreq === 0) continue;
    const idf = corpus.idf.get(term) ?? 0;
    const numerator = termFreq * (BM25_K1 + 1);
    const denominator = termFreq + BM25_K1 * (1 - BM25_B + BM25_B * (docLen / corpus.avgDocLen));
    score += idf * (numerator / denominator);
  }
  return score;
}

// ─── Hash Embedding (fallback / secondary signal) ────────────────────────────

/**
 * Deterministic pseudo-embedding based on character n-gram hashing.
 * Used as a secondary signal when BM25 scores are tied.
 */
export function hashEmbedding(text: string, dims = 128): number[] {
  const vec = new Array<number>(dims).fill(0);
  const tokens = tokenise(text);

  for (const word of tokens) {
    let h = 5381;
    for (let i = 0; i < word.length; i++) {
      h = ((h << 5) + h) + word.charCodeAt(i);
      h = h & 0x7fffffff;
    }
    vec[h % dims] += 1;

    if (word.length > 2) {
      for (let i = 0; i < word.length - 1; i++) {
        let bh = 5381;
        bh = ((bh << 5) + bh) + word.charCodeAt(i);
        bh = ((bh << 5) + bh) + word.charCodeAt(i + 1);
        bh = bh & 0x7fffffff;
        vec[bh % dims] += 0.5;
      }
    }
  }

  const magnitude = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / magnitude);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── Ingestion ───────────────────────────────────────────────────────────────

/**
 * Chunk a knowledge article and store all chunks in the DB.
 * Embeddings are stored as hash vectors (no external API required).
 * Deletes existing chunks for the article before re-ingesting.
 */
export async function ingestArticle(articleId: number): Promise<{ chunksCreated: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [article] = await db
    .select()
    .from(knowledgeArticles)
    .where(eq(knowledgeArticles.id, articleId));

  if (!article) throw new Error(`Article ${articleId} not found`);

  // Delete existing chunks
  await db.delete(knowledgeChunks).where(eq(knowledgeChunks.articleId, articleId));

  // Chunk the content (prepend title + source for context)
  const fullText = `${article.title}\nSource: ${article.source}\n\n${article.content}`;
  const chunks = chunkText(fullText);

  // Store each chunk with its hash embedding
  const insertRows = chunks.map((chunk, i) => ({
    articleId,
    chunkIndex: i,
    chunkText: chunk,
    embeddingJson: JSON.stringify(hashEmbedding(chunk)),
  }));

  if (insertRows.length > 0) {
    await db.insert(knowledgeChunks).values(insertRows);
  }

  return { chunksCreated: insertRows.length };
}

// ─── Retrieval ───────────────────────────────────────────────────────────────

export interface RetrievedChunk {
  chunkText: string;
  articleTitle: string;
  source: string;
  sourceUrl: string | null;
  similarity: number;
}

/**
 * Retrieve the top-K most relevant knowledge chunks for a given query.
 * Uses BM25 as the primary scoring method with hash-embedding as a tiebreaker.
 * Only returns chunks from active articles.
 */
export async function retrieveContext(
  query: string,
  topK = 3,
  minScore = 0.1
): Promise<RetrievedChunk[]> {
  const db = await getDb();
  if (!db) return [];

  // Get all active chunks with their article info
  const rows = await db
    .select({
      chunkText: knowledgeChunks.chunkText,
      embeddingJson: knowledgeChunks.embeddingJson,
      articleTitle: knowledgeArticles.title,
      source: knowledgeArticles.source,
      sourceUrl: knowledgeArticles.sourceUrl,
    })
    .from(knowledgeChunks)
    .innerJoin(knowledgeArticles, eq(knowledgeChunks.articleId, knowledgeArticles.id))
    .where(eq(knowledgeArticles.isActive, true));

  if (rows.length === 0) return [];

  // Build BM25 corpus from all chunks
  const corpus = buildBM25Corpus(rows.map(r => r.chunkText));
  const queryTokens = tokenise(query);
  const queryEmbedding = hashEmbedding(query);

  // Score all chunks
  const scored = rows.map((row, i) => {
    const bm25 = bm25Score(queryTokens, corpus.docs[i], corpus);

    // Secondary: cosine similarity from hash embedding
    let cosine = 0;
    if (row.embeddingJson) {
      try {
        const vec = JSON.parse(row.embeddingJson) as number[];
        cosine = cosineSimilarity(queryEmbedding, vec);
      } catch {
        // ignore
      }
    }

    // Combined score: BM25 dominates, cosine breaks ties
    const combined = bm25 * 0.8 + cosine * 0.2;

    return {
      chunkText: row.chunkText,
      articleTitle: row.articleTitle,
      source: row.source,
      sourceUrl: row.sourceUrl,
      similarity: combined,
    };
  });

  // Filter, sort, deduplicate
  const filtered = scored
    .filter(r => r.similarity >= minScore)
    .sort((a, b) => b.similarity - a.similarity);

  const seen = new Map<string, number>();
  const results: RetrievedChunk[] = [];
  for (const chunk of filtered) {
    const count = seen.get(chunk.articleTitle) ?? 0;
    if (count < 2) {
      results.push(chunk);
      seen.set(chunk.articleTitle, count + 1);
    }
    if (results.length >= topK) break;
  }

  return results;
}

// ─── Context Formatting ──────────────────────────────────────────────────────

/**
 * Format retrieved chunks into a clean block for injection into a system prompt.
 */
export function formatContextBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";

  const lines = [
    "## Relevant Knowledge Base Context",
    "The following excerpts from trusted domain sources are relevant to this conversation. Use them to ground your response in authoritative content:",
    "",
  ];

  for (const chunk of chunks) {
    const citation = chunk.sourceUrl
      ? `[${chunk.source}](${chunk.sourceUrl})`
      : chunk.source;
    lines.push(`### ${chunk.articleTitle} — ${citation}`);
    lines.push(chunk.chunkText);
    lines.push("");
  }

  lines.push("---");
  lines.push("When referencing the above, cite the source by name (e.g., 'According to Gartner 2025...').");

  return lines.join("\n");
}
