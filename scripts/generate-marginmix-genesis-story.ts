/**
 * MarginMix genesis story: git timeline + Replit Agent user requests (human-readable).
 * Output: generated-artifacts/marginmix-genesis-story/<timestamp>/GENESIS.md
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const TRANSCRIPT_ROOT = path.join(
  REPO_ROOT,
  ".local/state/replit/agent/transcript",
);

type MemoryBlock = {
  memory_id?: number;
  messages?: Array<{
    role?: string;
    content?: Array<{ type?: string; text?: string }> | string;
  }>;
};

function sh(cmd: string): string {
  return execSync(cmd, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
}

function findTranscript(): string | null {
  if (!fs.existsSync(TRANSCRIPT_ROOT)) return null;
  for (const name of fs.readdirSync(TRANSCRIPT_ROOT)) {
    const p = path.join(TRANSCRIPT_ROOT, name, "transcript.jsonl");
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function userText(content: MemoryBlock["messages"][0]["content"]): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!)
    .join("\n");
}

function cleanUserMessage(raw: string): string {
  let t = raw;
  const um = t.match(/<user_message>([\s\S]*?)<\/user_message>/);
  if (um) t = um[1].trim();
  t = t.replace(/<attached_contents>[\s\S]*?<\/attached_contents>/g, "").trim();
  t = t.replace(/<canvas_viewport_context>[\s\S]*?<\/canvas_viewport_context>/g, "").trim();
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

function loadUserTurns(filePath: string): { index: number; memoryId: number; text: string }[] {
  const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);
  const turns: { index: number; memoryId: number; text: string }[] = [];
  let userIndex = 0;
  for (const line of lines) {
    let block: MemoryBlock;
    try {
      block = JSON.parse(line) as MemoryBlock;
    } catch {
      continue;
    }
    for (const msg of block.messages ?? []) {
      if (msg.role !== "user") continue;
      const text = cleanUserMessage(userText(msg.content));
      if (!text || text.length < 3) continue;
      userIndex++;
      turns.push({
        index: userIndex,
        memoryId: block.memory_id ?? userIndex,
        text,
      });
    }
  }
  return turns;
}

function gitSection(): string {
  const total = sh("git rev-list --count HEAD");
  const authors = sh(
    "git log --format='%an' | sort | uniq -c | sort -rn | head -8",
  );
  const monthly = sh(
    "git log --format='%aI' | cut -c1-7 | sort | uniq -c | sort -k2",
  );
  const first = sh("git log --reverse --format='- **%h** (%aI) — %s' | head -20");
  const milestones = sh(
    `git log --format='%h|%aI|%s' | grep -iE 'margin mix|marginmix|rebrand|yourbrief|decision engine|weighted scoring|profiler|replit auth|clerk' | head -25`,
  ).split("\n").filter(Boolean);

  const milestoneLines = milestones.length
    ? milestones
        .map((l) => {
          const [h, d, ...rest] = l.split("|");
          return `- **${h}** (${d?.slice(0, 10) ?? "?"}) — ${rest.join("|")}`;
        })
        .join("\n")
    : "_No milestone grep matches._";

  return `## Part 1 — What git shows (the shipped record)

**Total commits on \`HEAD\`:** ${total}

Paxel uses this layer for outcomes and velocity. It does **not** contain planning conversations—only commit subjects and diffs.

### Authors (top)

\`\`\`
${authors}
\`\`\`

### Commits by month

\`\`\`
${monthly}
\`\`\`

### First 20 commits (genesis week)

${first}

### Selected milestone commits (name / product themes)

${milestoneLines}
`;
}

function agentSection(turns: { index: number; memoryId: number; text: string }[], source: string): string {
  const preview = turns
    .map((t) => {
      const body = t.text.length > 1200 ? `${t.text.slice(0, 1200)}\n\n… _(truncated)_` : t.text;
      return `### Request ${t.index} _(memory_id ${t.memoryId})_\n\n${body}`;
    })
    .join("\n\n---\n\n");

  return `## Part 2 — What Replit Agent recorded (plan / build intent)

**Source:** \`${path.relative(REPO_ROOT, source)}\`  
**User requests extracted:** ${turns.length}

These are **your instructions to Replit Agent** on this Repl (not Cursor, not Paxel). They are the closest on-disk record of *how* you directed work, in chronological file order. Timestamps are not stored per line in this JSONL—pair requests with git dates manually when needed.

${preview || "_No user messages found._"}
`;
}

function framingSection(): string {
  return `## Part 3 — How to read this (vs Paxel)

| Layer | What it tells you |
|--------|-------------------|
| **Git (Part 1)** | Chronology of **what merged**: bootstrap Aug 2025 as campaign-brief app → later MarginMix / assessment / decision engine. |
| **Replit Agent (Part 2)** | **What you asked for** in agent sessions on this Repl (UI, profiler, assessment flow, etc.). |
| **Paxel report (1 Cursor session)** | Recent remote Cursor chat only—not scratch build. |
| **Replit export** | Run \`bash scripts/export-replit-agent-transcript.sh\` for full tool-level detail (TSV + raw optional). |

This document is a **genesis map**, not a Paxel upload. For planning-vs-shipping analysis, Paxel still needs **many** supported-agent sessions over time.

## Part 4 — Suggested narrative arc (from git + product files)

1. **Aug 2025** — Initial stack: Express/React, campaign brief chat, OAuth, landing page (\`replit.md\` / early commits).
2. **2025–2026** — Shift toward **margin risk**: assessments, decision engine, PDFs, weighted scoring, Quick Profiler (see \`replit.md\` Recent Changes).
3. **2026** — Auth and infra iterations (Replit Auth, Clerk migration notes in skills), deployment polish.

For a **deeper** tool-by-tool replay, open the latest \`generated-artifacts/replit-agent-export/*/27897d74-….md\` alongside this file.
`;
}

function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(REPO_ROOT, "generated-artifacts/marginmix-genesis-story", stamp);
  fs.mkdirSync(outDir, { recursive: true });

  const transcript = findTranscript();
  const turns = transcript ? loadUserTurns(transcript) : [];

  const body = [
    "# MarginMix genesis story",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Combined **git history** (859 commits on this clone) and **Replit Agent user requests** for a single readable artifact. Use this when Paxel’s one-session report cannot represent how the product was planned and built.",
    "",
    "---",
    "",
    gitSection(),
    "",
    "---",
    "",
    transcript
      ? agentSection(turns, transcript)
      : "## Part 2 — Replit Agent\n\n_No transcript found under `.local/state/replit/agent/transcript/`._",
    "",
    "---",
    "",
    framingSection(),
    "",
  ].join("\n");

  const outFile = path.join(outDir, "GENESIS.md");
  fs.writeFileSync(outFile, body);
  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        commitCount: Number(sh("git rev-list --count HEAD")),
        replitUserTurns: turns.length,
        transcript: transcript ? path.relative(REPO_ROOT, transcript) : null,
      },
      null,
      2,
    ) + "\n",
  );

  console.log(outFile);
  console.log(`Commits: ${sh("git rev-list --count HEAD")}, Replit user turns: ${turns.length}`);
}

main();
