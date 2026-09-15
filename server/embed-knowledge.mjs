/**
 * Triggers embedding generation for all knowledge articles that have no chunks yet.
 * This calls the same ingestArticle function used by the admin panel.
 * Run: node server/embed-knowledge.mjs
 */

import "dotenv/config";
import mysql from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
if (!FORGE_API_URL) { console.error("BUILT_IN_FORGE_API_URL not set"); process.exit(1); }
if (!FORGE_API_KEY) { console.error("BUILT_IN_FORGE_API_KEY not set"); process.exit(1); }

// ─── Chunking (mirrors server/rag.ts) ────────────────────────────────────────
function chunkText(text, maxChunkSize = 800, overlap = 100) {
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
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

// ─── Embedding via Forge API ─────────────────────────────────────────────────
async function embedText(text) {
  const response = await fetch(`${FORGE_API_URL}/v1/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-004",
      input: text,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Embedding API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const conn = await mysql.createConnection(DB_URL);
  console.log("Connected to database.\n");

  // Get all articles
  const [articles] = await conn.execute("SELECT id, title, content FROM knowledgeArticles WHERE isActive = 1");
  console.log(`Found ${articles.length} active articles.\n`);

  for (const article of articles) {
    // Check if already has chunks
    const [existing] = await conn.execute(
      "SELECT COUNT(*) as cnt FROM knowledgeChunks WHERE articleId = ?",
      [article.id]
    );
    if (existing[0].cnt > 0) {
      console.log(`⏭  Skipping "${article.title}" — already has ${existing[0].cnt} chunks`);
      continue;
    }

    console.log(`Processing "${article.title}"...`);
    const chunks = chunkText(article.content);
    console.log(`  → ${chunks.length} chunks`);

    let embeddedCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await embedText(chunks[i]);
        await conn.execute(
          "INSERT INTO knowledgeChunks (articleId, chunkIndex, chunkText, embeddingJson) VALUES (?, ?, ?, ?)",
          [article.id, i, chunks[i], JSON.stringify(embedding)]
        );
        embeddedCount++;
        process.stdout.write(`  → Chunk ${i + 1}/${chunks.length} embedded\r`);
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`\n  ✗ Failed chunk ${i}: ${err.message}`);
      }
    }

    console.log(`\n  ✓ Done: ${embeddedCount}/${chunks.length} chunks embedded`);
  }

  await conn.end();
  console.log("\nEmbedding generation complete.");
}

main().catch(console.error);
