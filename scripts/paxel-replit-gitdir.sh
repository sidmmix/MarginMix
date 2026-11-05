#!/usr/bin/env bash
# Replit: Cursor stores agent-transcripts under ~/.cursor/projects/home-runner/
# (workspace /home/runner). Link that path to MarginMix git so Paxel can match sessions.
set -euo pipefail

gitdir_target="/home/runner/workspace/.git"
gitdir_file="/home/runner/.git"

if [ ! -d "$gitdir_target" ]; then
  echo "paxel-replit-gitdir: missing $gitdir_target" >&2
  exit 1
fi

if [ -e "$gitdir_file" ] && [ ! -f "$gitdir_file" ]; then
  echo "paxel-replit-gitdir: $gitdir_file exists and is not a file; not changing it" >&2
  exit 1
fi

printf 'gitdir: %s\n' "$gitdir_target" > "$gitdir_file"
