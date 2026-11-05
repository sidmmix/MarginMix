/**
 * Export Replit Agent transcripts (.local/state/replit/agent/transcript/.../transcript.jsonl)
 * to readable Markdown for review (Paxel does not ingest this format).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_TRANSCRIPT_ROOT = path.join(
  REPO_ROOT,
  ".local/state/replit/agent/transcript",
);

type ContentPart = { type?: string; text?: string };
type ToolCall = { type?: string; name?: string; arguments?: Record<string, unknown> };
type Message = {
  role?: string;
  content?: ContentPart[] | string;
  tool_calls?: ToolCall[];
};

type MemoryBlock = {
  memory_id?: number;
  messages?: Message[];
};

function parseArgs(argv: string[]) {
  let outDir = "";
  let transcriptRoot = DEFAULT_TRANSCRIPT_ROOT;
  let stripCanvas = true;
  let copyRaw = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out" && argv[i + 1]) {
      outDir = argv[++i];
    } else if (a === "--transcript-root" && argv[i + 1]) {
      transcriptRoot = path.resolve(argv[++i]);
    } else if (a === "--keep-canvas") {
      stripCanvas = false;
    } else if (a === "--copy-raw") {
      copyRaw = true;
    } else if (a === "-h" || a === "--help") {
      console.log(`Usage: npx tsx scripts/export-replit-agent-transcript.ts [options]

Options:
  --out DIR              Output directory (default: generated-artifacts/replit-agent-export/<timestamp>)
  --transcript-root DIR  Root containing <uuid>/transcript.jsonl
  --keep-canvas          Keep canvas_viewport_context in user messages
  --copy-raw             Copy source JSONL into output/raw/
`);
      process.exit(0);
    }
  }
  if (!outDir) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    outDir = path.join(REPO_ROOT, "generated-artifacts/replit-agent-export", stamp);
  }
  return { outDir: path.resolve(outDir), transcriptRoot, stripCanvas, copyRaw };
}

function findTranscripts(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const files: string[] = [];
  for (const name of fs.readdirSync(root)) {
    const p = path.join(root, name, "transcript.jsonl");
    if (fs.statSync(path.join(root, name)).isDirectory() && fs.existsSync(p)) {
      files.push(p);
    }
  }
  return files.sort();
}

function textFromContent(content: Message["content"]): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!)
    .join("\n");
}

function cleanUserText(raw: string, stripCanvas: boolean): string {
  let t = raw;
  const um = t.match(/<user_message>([\s\S]*?)<\/user_message>/);
  if (um) t = um[1].trim();
  if (stripCanvas) {
    t = t.replace(/<attached_contents>[\s\S]*?<\/attached_contents>/g, "").trim();
    t = t.replace(/<canvas_viewport_context>[\s\S]*?<\/canvas_viewport_context>/g, "").trim();
  }
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n… [truncated ${s.length - max} chars]`;
}

function toolSummary(tc: ToolCall): string {
  const name = tc.name ?? "tool";
  const args = tc.arguments ?? {};
  const fp = args.file_path ?? args.path;
  if (typeof fp === "string") return `${name} ${fp}`;
  const cmd = args.command;
  if (typeof cmd === "string") return `${name} ${truncate(cmd.replace(/\s+/g, " "), 120)}`;
  return name;
}

function loadBlocks(filePath: string): MemoryBlock[] {
  const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);
  const blocks: MemoryBlock[] = [];
  for (const line of lines) {
    try {
      blocks.push(JSON.parse(line) as MemoryBlock);
    } catch {
      /* skip malformed */
    }
  }
  return blocks;
}

function exportOne(
  filePath: string,
  outDir: string,
  opts: { stripCanvas: boolean; copyRaw: boolean; label: string },
) {
  const blocks = loadBlocks(filePath);
  const mdLines: string[] = [
    `# Replit Agent transcript — ${opts.label}`,
    "",
    `- Source: \`${path.relative(REPO_ROOT, filePath)}\``,
    `- Memory blocks: ${blocks.length}`,
    "",
    "---",
    "",
  ];
  const toolRows: string[] = ["memory_id\trole\ttool_or_note\tdetail"];

  let turn = 0;
  for (const block of blocks) {
    turn++;
    const mid = block.memory_id ?? turn;
    mdLines.push(`## Turn ${turn} (memory_id ${mid})`, "");

    for (const msg of block.messages ?? []) {
      const role = msg.role ?? "unknown";
      if (role === "user") {
        const text = cleanUserText(textFromContent(msg.content), opts.stripCanvas);
        if (text) {
          mdLines.push("### User", "", text, "");
        }
        continue;
      }
      if (role === "assistant") {
        const text = textFromContent(msg.content);
        if (text) {
          mdLines.push("### Assistant", "", text, "");
        }
        if (msg.tool_calls?.length) {
          mdLines.push("### Tools (planned)", "");
          for (const tc of msg.tool_calls) {
            const sum = toolSummary(tc);
            mdLines.push(`- ${sum}`);
            toolRows.push(`${mid}\tassistant\t${tc.name ?? "tool"}\t${sum.replace(/\t/g, " ")}`);
          }
          mdLines.push("");
        }
        continue;
      }
      if (role === "tool") {
        const text = truncate(textFromContent(msg.content), 800);
        mdLines.push("### Tool result", "", "```", text, "```", "");
        toolRows.push(`${mid}\ttool\tresult\t${truncate(text.replace(/\s+/g, " "), 200)}`);
      }
    }
  }

  const safeLabel = opts.label.replace(/[^a-zA-Z0-9._-]+/g, "_");
  fs.writeFileSync(path.join(outDir, `${safeLabel}.md`), mdLines.join("\n"));
  fs.writeFileSync(path.join(outDir, `${safeLabel}-tools.tsv`), toolRows.join("\n") + "\n");

  if (opts.copyRaw) {
    const rawDir = path.join(outDir, "raw");
    fs.mkdirSync(rawDir, { recursive: true });
    fs.copyFileSync(filePath, path.join(rawDir, `${safeLabel}.jsonl`));
  }

  return {
    label: opts.label,
    source: path.relative(REPO_ROOT, filePath),
    memoryBlocks: blocks.length,
    userTurns: blocks.filter((b) =>
      (b.messages ?? []).some((m) => m.role === "user"),
    ).length,
  };
}

function main() {
  const { outDir, transcriptRoot, stripCanvas, copyRaw } = parseArgs(process.argv.slice(2));
  const sources = findTranscripts(transcriptRoot);

  if (sources.length === 0) {
    console.error(`No transcript.jsonl under ${transcriptRoot}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const stats = sources.map((src) => {
    const label = path.basename(path.dirname(src));
    return exportOne(src, outDir, { stripCanvas, copyRaw, label });
  });

  const summary = [
    "# Replit Agent export",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "These files are for **human review**. Paxel upload does not read Replit Agent JSONL.",
    "",
    "## Sources",
    "",
    ...stats.map(
      (s) =>
        `- **${s.label}**: ${s.memoryBlocks} memory blocks (${s.userTurns} with user messages) — \`${s.source}\``,
    ),
    "",
    "## Files",
    "",
    ...stats.flatMap((s) => [
      `- \`${s.label}.md\` — readable conversation`,
      `- \`${s.label}-tools.tsv\` — tool call index`,
    ]),
    "",
    "## Re-run",
    "",
    "```sh",
    "npx tsx scripts/export-replit-agent-transcript.ts",
    "```",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(outDir, "README.md"), summary);
  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), stats }, null, 2) + "\n",
  );

  console.log(`Exported ${sources.length} transcript(s) to:\n  ${outDir}`);
  for (const s of stats) {
    console.log(`  - ${s.label}: ${s.memoryBlocks} blocks, ${s.userTurns} user turns`);
  }
}

main();
