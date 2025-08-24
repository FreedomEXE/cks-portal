require("dotenv/config");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const readlineSync = require("readline-sync");
const crypto = require("crypto");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** ====== CONFIG ====== **/
const PROJECT_ROOT = process.cwd();
const INDEX_PATH = path.join(PROJECT_ROOT, ".ai", "index.json");
const ALLOWED_EXT = new Set([
  ".ts",".tsx",".js",".jsx",".json",".md",".mdx",".yml",".yaml",".txt",
  ".css",".scss",".html",".sql",".prisma",".py",".go",".rs",".java",".c",".cpp"
]);
const IGNORE_DIRS = new Set(["node_modules",".git",".next","dist","build",".turbo",".cache",".pnpm-store"]);
const MAX_FILES = 6000;         // hard cap
const MAX_FILE_BYTES = 400_000; // per-file read cap
const CHUNK_SIZE = 1200;        // chars per chunk
const CHUNK_OVERLAP = 200;      // overlap to preserve context
const TOP_K = 20;               // chunks retrieved per query
const EMBEDDING_MODEL = "text-embedding-3-small"; // cheap & good
/** ===================== **/

/** Utils **/
const sha1 = (s) => crypto.createHash("sha1").update(s).digest("hex");
function isBinaryExt(ext) {
  return [".png",".jpg",".jpeg",".gif",".webp",".pdf",".zip",".ico",".lock",".woff",".woff2",".ttf"].includes(ext);
}
function* chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  let i = 0;
  while (i < text.length) {
    const end = Math.min(text.length, i + size);
    yield text.slice(i, end);
    i = end - overlap;
    if (i < 0) i = 0;
    if (i >= text.length) break;
  }
}
function walk(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      const rel = path.relative(PROJECT_ROOT, p);
      if (e.isDirectory()) {
        if (IGNORE_DIRS.has(e.name)) continue;
        stack.push(p);
      } else {
        out.push(rel);
      }
    }
  }
  return out;
}

function tryRead(file) {
  try {
    const abs = path.join(PROJECT_ROOT, file);
    if (fs.statSync(abs).size > MAX_FILE_BYTES) {
      return fs.readFileSync(abs, "utf8").slice(0, MAX_FILE_BYTES);
    }
    return fs.readFileSync(abs, "utf8");
  } catch { return null; }
}

function ensureDir(p) {
  const d = path.dirname(p);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

async function embedBatch(texts) {
  const res = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts
  });
  return res.data.map(v => v.embedding);
}

function cosine(a, b) {
  let dot=0, na=0, nb=0;
  for (let i=0;i<a.length;i++){ dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; }
  return dot / (Math.sqrt(na)*Math.sqrt(nb) + 1e-9);
}

/** Load/Save index **/
function loadIndex() {
  try { return JSON.parse(fs.readFileSync(INDEX_PATH, "utf8")); }
  catch { return { model: EMBEDDING_MODEL, chunks: [] }; }
}
function saveIndex(idx) {
  ensureDir(INDEX_PATH);
  fs.writeFileSync(INDEX_PATH, JSON.stringify(idx), "utf8");
}

/** Indexer **/
async function buildIndex(dir = ".") {
  const idx = { model: EMBEDDING_MODEL, chunks: [] };
  const files = walk(path.resolve(PROJECT_ROOT, dir))
    .slice(0, MAX_FILES)
    .filter(rel => {
      const ext = path.extname(rel).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) return false;
      if (isBinaryExt(ext)) return false;
      return true;
    });

  console.log(`Indexing ${files.length} files...`);
  const toEmbed = [];
  for (const rel of files) {
    const content = tryRead(rel);
    if (!content) continue;
    for (const part of chunkText(content)) {
      const id = sha1(rel + "::" + sha1(part));
      toEmbed.push({ id, file: rel, text: part });
    }
  }
  console.log(`Preparing ${toEmbed.length} chunks...`);

  // embed in batches
  const BATCH=64;
  for (let i=0;i<toEmbed.length;i+=BATCH) {
    const batch = toEmbed.slice(i,i+BATCH);
    const embeds = await embedBatch(batch.map(b=>b.text));
    for (let j=0;j<batch.length;j++) {
      idx.chunks.push({
        id: batch[j].id,
        file: batch[j].file.replace(/\\/g,"/"),
        text: batch[j].text,
        embedding: embeds[j]
      });
    }
    process.stdout.write(`\rEmbedded ${Math.min(i+BATCH,toEmbed.length)}/${toEmbed.length}`);
  }
  console.log("\nSaving index...");
  saveIndex(idx);
  console.log(`Index saved to ${INDEX_PATH}`);
}

/** Retrieve **/
function topK(idx, queryEmbedding, k = TOP_K) {
  const scores = idx.chunks.map((c, i) => [i, cosine(c.embedding, queryEmbedding)]);
  scores.sort((a,b)=>b[1]-a[1]);
  return scores.slice(0,k).map(([i,score]) => ({...idx.chunks[i], score}));
}

/** Ask with context **/
async function askWithRepoContext(question) {
  const idx = loadIndex();
  if (!idx.chunks.length) {
    return "No index found. Run `/index .` first.";
  }
  const qEmbed = (await embedBatch([question]))[0];
  const hits = topK(idx, qEmbed, TOP_K);

  const contextBlocks = hits.map((h, n) =>
    `-----[${n+1}] ${h.file} (score=${h.score.toFixed(3)})-----\n${h.text}`
  ).join("\n\n");

  const system = {
    role: "system",
    content: "You are ChatGPT-5 assisting on the CKS codebase. Use provided context snippets; cite file paths you relied on."
  };

  const prompt = [
    "You are given N code/documentation snippets from this repository.",
    "Answer the user's question using only what’s necessary; if info is missing, say exactly which file(s) to inspect next.",
    "Prefer precise, actionable steps, and include quick citations like [file/path:lines?] near claims.",
    "",
    "=== SNIPPETS START ===",
    contextBlocks,
    "=== SNIPPETS END ===",
    "",
    "User question:",
    question
  ].join("\n");

  const res = await client.chat.completions.create({
    model: "gpt-5",
    messages: [{ role: "user", content: prompt }]
  });

  return res.choices[0].message.content?.trim() || "";
}

/** REPL with commands **/
async function main() {
  console.log("GPT-5 Repo terminal. Commands:");
  console.log("  /index <folder>   build (or rebuild) embeddings index (e.g., /index .)");
  console.log("  /ask <question>   ask with repo context retrieval");
  console.log("  /help             show commands");
  console.log("Press Enter on an empty line to exit.\n");

  for (;;) {
    const input = readlineSync.question("You: ");
    if (!input) break;

    if (input.startsWith("/index")) {
      const dir = input.replace(/^\/index\s*/, "") || ".";
      try {
        await buildIndex(dir);
      } catch (e) {
        console.error("Index error:", e.message);
      }
      continue;
    }

    if (input.startsWith("/ask")) {
      const q = input.replace(/^\/ask\s*/, "").trim();
      if (!q) { console.log("Usage: /ask <question>\n"); continue; }
      try {
        const ans = await askWithRepoContext(q);
        console.log("\nGPT:\n" + ans + "\n");
      } catch (e) {
        console.error("Ask error:", e.message);
      }
      continue;
    }

    if (input === "/help") {
      console.log("\nCommands: /index <folder>, /ask <question>\n");
      continue;
    }

    // default: plain chat (no retrieval)
    const res = await client.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: input }]
    });
    console.log("\nGPT:\n" + (res.choices[0].message.content?.trim() || "") + "\n");
  }
}

main().catch(e => console.error("Fatal:", e));
