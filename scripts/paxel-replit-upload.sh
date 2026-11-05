#!/usr/bin/env bash
# Run Paxel upload on Replit where Cursor sessions live under /home/runner, not workspace/.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
bash scripts/paxel-replit-gitdir.sh

PAXEL_SH="${HOME}/.paxel/paxel.sh"
MARKER="# >>> replit-cursor-prelude (MarginMix)"

apply_cursor_prelude_patch() {
  local cache="$PAXEL_SH"
  [ -f "$cache" ] || return 0
  if grep -qF "$MARKER" "$cache" 2>/dev/null; then
    return 0
  fi
  python3 - <<'PY' "$cache" "$MARKER"
import sys
path, marker = sys.argv[1], sys.argv[2]
text = open(path, encoding="utf-8").read()
if marker in text:
    sys.exit(0)
needle = '''  local store_count="${PAXEL_STORE_SESSIONS:-0}"
  local session_count=$((claude_count + codex_standalone_count + opencode_count + gemini_count + vscode_count + antigravity_count + store_count))

  if [ "$session_count" -eq 0 ]; then'''
insert = f'''  local store_count="${{PAXEL_STORE_SESSIONS:-0}}"
  local session_count=$((claude_count + codex_standalone_count + opencode_count + gemini_count + vscode_count + antigravity_count + store_count))

  {marker}
  local _replit_cursor_sessions=0
  if [ -d "${{CURSOR_PROJECTS_DIR:-}}" ]; then
    _replit_cursor_sessions=$(find "$CURSOR_PROJECTS_DIR" -path '*/agent-transcripts/*/*.jsonl' ! -path '*/subagents/*' 2>/dev/null | wc -l | tr -d ' ')
  fi
  if [ "$session_count" -eq 0 ] && [ "${{_replit_cursor_sessions:-0}}" -gt 0 ]; then
    session_count=$_replit_cursor_sessions
  fi

  if [ "$session_count" -eq 0 ]; then'''
if needle not in text:
    sys.exit("paxel-replit-upload: could not patch session_count gate in paxel.sh")
open(path, "w", encoding="utf-8").write(text.replace(needle, insert, 1))
PY
}

# Ensure cached upload script exists (launcher refreshes on run).
if [ ! -f "$PAXEL_SH" ]; then
  curl -fsSL --proto '=https' --tlsv1.2 --connect-timeout 10 --max-time 120 \
    'https://paxel.ycombinator.com/paxel.sh' -o "$PAXEL_SH"
  chmod 600 "$PAXEL_SH" 2>/dev/null || true
fi

apply_cursor_prelude_patch

# Upload's parse_since rejects "all" (setup-only). Drop --since all = no session date cutoff.
upload_args=()
while [ $# -gt 0 ]; do
  if [ "$1" = --since ] && [ "${2:-}" = all ]; then
    echo "paxel-replit-upload: ignoring --since all (upload has no cutoff; git uses --commits only)" >&2
    shift 2
    continue
  fi
  upload_args+=("$1")
  shift
done

exec bash "$PAXEL_SH" "${upload_args[@]}"
