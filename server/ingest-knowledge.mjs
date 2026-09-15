/**
 * Ingest all knowledge articles into chunks using BM25 hash embeddings.
 * Run: node server/ingest-knowledge.mjs
 */

import "dotenv/config";
import mysql from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

// ─── Chunking (mirrors server/rag.ts) ────────────────────────────────────────
const CHUNK_SIZE_WORDS = 120;
const CHUNK_OVERLAP_WORDS = 20;

function chunkText(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
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

// ─── Hash Embedding (mirrors server/rag.ts) ───────────────────────────────────
function tokenise(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s\-]/g, " ").split(/\s+/).filter(t => t.length > 1);
}

function hashEmbedding(text, dims = 128) {
  const vec = new Array(dims).fill(0);
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

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const conn = await mysql.createConnection(DB_URL);
  console.log("Connected to database.\n");

  const [articles] = await conn.execute("SELECT id, title, source, content FROM knowledgeArticles WHERE isActive = 1");
  console.log(`Found ${articles.length} active articles.\n`);

  let totalChunks = 0;

  for (const article of articles) {
    // Delete existing chunks
    await conn.execute("DELETE FROM knowledgeChunks WHERE articleId = ?", [article.id]);

    const fullText = `${article.title}\nSource: ${article.source}\n\n${article.content}`;
    const chunks = chunkText(fullText);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = hashEmbedding(chunks[i]);
      await conn.execute(
        "INSERT INTO knowledgeChunks (articleId, chunkIndex, chunkText, embeddingJson) VALUES (?, ?, ?, ?)",
        [article.id, i, chunks[i], JSON.stringify(embedding)]
      );
    }

    console.log(`✓ "${article.title}" → ${chunks.length} chunks`);
    totalChunks += chunks.length;
  }

  await conn.end();
  console.log(`\nDone. ${totalChunks} total chunks ingested across ${articles.length} articles.`);
}

main().catch(console.error);
