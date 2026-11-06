#!/usr/bin/env bash
# Bundle Replit Agent artifacts for download (transcript JSONL + per-commit agent_state bins).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENT_DIR="$ROOT/.local/state/replit/agent"
STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
OUT="$ROOT/generated-artifacts/marginmix-agent-download/$STAMP"
ZIP="$ROOT/generated-artifacts/marginmix-agent-download/marginmix-replit-agent-history-$STAMP.zip"

mkdir -p "$OUT/transcript" "$OUT/agent_state_by_commit" "$OUT/metadata"

TRANSCRIPT="$(find "$AGENT_DIR/transcript" -name transcript.jsonl 2>/dev/null | head -1)"
if [ -z "$TRANSCRIPT" ]; then
  echo "No transcript.jsonl under $AGENT_DIR/transcript" >&2
  exit 1
fi

cp -a "$TRANSCRIPT" "$OUT/transcript/transcript.jsonl"
SESSION_ID="$(basename "$(dirname "$TRANSCRIPT")")"
echo "$SESSION_ID" > "$OUT/transcript/session_id.txt"

if [ -f "$AGENT_DIR/.agent_state_main.bin" ]; then
  cp -a "$AGENT_DIR/.agent_state_main.bin" "$OUT/agent_state_by_commit/"
fi

copied=0
while IFS= read -r -d '' bin; do
  base="$(basename "$bin")"
  hash="${base#.agent_state_}"
  hash="${hash%.bin}"
  cp -a "$bin" "$OUT/agent_state_by_commit/${hash}.bin"
  copied=$((copied + 1))
done < <(find "$AGENT_DIR" -maxdepth 1 -name '.agent_state_*.bin' ! -name '.agent_state_main.bin' -print0 2>/dev/null)

{
  echo -e "commit\tdate\tauthor\tsubject\thas_agent_state_bin"
  git -C "$ROOT" log --format='%H%x09%aI%x09%an%x09%s' | while IFS=$'\t' read -r full date author subject; do
    short="${full:0:7}"
    has=no
    [ -f "$OUT/agent_state_by_commit/${full}.bin" ] && has=yes
    printf '%s\t%s\t%s\t%s\t%s\n' "$short" "$date" "$author" "$subject" "$has"
  done
} > "$OUT/metadata/commits-with-agent-state.tsv"

total_commits="$(git -C "$ROOT" rev-list --count HEAD)"

cat > "$OUT/README.md" <<EOF
# MarginMix Replit Agent history bundle

Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)

## Important: this is not 859 conversation JSONL files

Replit stores **one** rolling agent conversation export:

- \`transcript/transcript.jsonl\` — all Replit Agent chat/tool turns Replit still has on this Repl (~$(wc -l < "$TRANSCRIPT") JSON lines / memory blocks).

Per **git commit**, Replit also stores **binary agent snapshots** (not chat JSONL):

- \`agent_state_by_commit/<full-sha>.bin\` — **$copied** files matched to git commits on this Repl.
- \`.agent_state_main.bin\` — current agent state pointer (if present).

**Total git commits on this clone:** $total_commits  
**Commits with an agent_state bin in this bundle:** $(grep -c $'\tyes$' "$OUT/metadata/commits-with-agent-state.tsv" || true)

Commits without a bin were made before Replit saved snapshots, or state was rotated away.

## Files

| Path | Purpose |
|------|--------|
| \`transcript/transcript.jsonl\` | Downloadable copy of Replit Agent conversation |
| \`agent_state_by_commit/*.bin\` | Opaque Replit snapshots keyed by commit SHA (not human-readable chat) |
| \`metadata/commits-with-agent-state.tsv\` | Index: every commit + whether a bin exists |

## Readable export (Markdown)

\`\`\`sh
bash scripts/export-replit-agent-transcript.sh --copy-raw --out generated-artifacts/replit-agent-export/manual
\`\`\`

## Paxel

Paxel does not ingest \`transcript.jsonl\` or \`.agent_state_*.bin\`.
EOF

(
  cd "$OUT/.."
  rm -f "$(basename "$ZIP")"
  zip -r "$(basename "$ZIP")" "$(basename "$OUT")"
)

echo ""
echo "Bundle directory:"
echo "  $OUT"
echo ""
echo "Zip (download this from Replit Files):"
echo "  $ZIP"
echo ""
echo "transcript.jsonl: $(wc -c < "$OUT/transcript/transcript.jsonl" | tr -d ' ') bytes"
echo "agent_state bins: $copied"
echo "git commits: $total_commits"
