#!/usr/bin/env bash
# Audit what this Repl can feed Paxel and print the best upload command.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=== MarginMix → Paxel readiness (Replit-only) ==="
echo ""

commits="$(git rev-list --count HEAD 2>/dev/null || echo 0)"
cursor_jsonl="$(find "$HOME/.cursor/projects" -path '*/agent-transcripts/*/*.jsonl' ! -path '*/subagents/*' 2>/dev/null | wc -l | tr -d ' ')"
claude_jsonl="$(find "$HOME/.claude" -name '*.jsonl' 2>/dev/null | wc -l | tr -d ' ')"
codex_jsonl="$(find "$HOME/.codex" -name '*.jsonl' 2>/dev/null | wc -l | tr -d ' ')"
replit_jsonl="$(find "$ROOT/.local/state/replit/agent/transcript" -name transcript.jsonl 2>/dev/null | wc -l | tr -d ' ')"
replit_bytes=0
if [ "$replit_jsonl" -gt 0 ]; then
  replit_bytes="$(wc -c < "$(find "$ROOT/.local/state/replit/agent/transcript" -name transcript.jsonl | head -1)" | tr -d ' ')"
fi
agent_bins="$(find "$ROOT/.local/state/replit/agent" -maxdepth 1 -name '.agent_state_*.bin' ! -name '.agent_state_main.bin' 2>/dev/null | wc -l | tr -d ' ')"

echo "Git commits on HEAD:              $commits"
echo "Cursor agent-transcripts (Paxel): $cursor_jsonl"
echo "Claude Code sessions (Paxel):     $claude_jsonl"
echo "Codex sessions (Paxel):           $codex_jsonl"
echo "Replit Agent transcript.jsonl:    $replit_jsonl (${replit_bytes} bytes) — NOT ingested by Paxel"
echo "Replit agent_state *.bin:         $agent_bins — NOT ingested by Paxel"
echo ""

if [ -f "$HOME/.paxel/token" ]; then
  echo "Paxel sign-in:                    token present"
else
  echo "Paxel sign-in:                    run upload once in Shell to sign in"
fi

if grep -qF 'replit-cursor-prelude' "$HOME/.paxel/paxel.sh" 2>/dev/null; then
  echo "Replit upload patch:              applied"
else
  echo "Replit upload patch:              missing — use scripts/paxel-replit-upload.sh"
fi

echo ""
echo "--- What Paxel can use for a BETTER report ---"
echo ""
paxel_sessions=$((cursor_jsonl + claude_jsonl + codex_jsonl))
if [ "$paxel_sessions" -lt 3 ]; then
  echo "• You have $paxel_sessions Paxel-readable session(s). Planning comparisons need many sessions."
  echo "  → Do new MarginMix work in Cursor (or Claude Code on this Repl) with explicit"
  echo "    plan-then-implement turns; re-upload every few sessions."
fi
echo "• Git: use --commits 1200 (not --since all — invalid on upload)."
echo "• Replit Agent history: use genesis + JSONL bundle for narrative; Paxel cannot merge it today."
echo "• Optional: email paxel@ycombinator.com — Replit Agent JSONL import for MarginMix."
echo ""
echo "Recommended upload (Replit Shell, let it finish):"
echo "  cd $ROOT"
echo "  bash scripts/paxel-replit-upload.sh --commits 1200"
echo ""
echo "Companion artifacts (not Paxel):"
echo "  bash scripts/generate-marginmix-genesis-story.sh"
echo "  bash scripts/bundle-replit-agent-download.sh"
