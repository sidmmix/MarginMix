#!/usr/bin/env bash
# Paxel transcript capture on Replit (remote dev box). Safe to rerun; always exits 0.
set -uo pipefail

if [ -z "${REPL_ID:-}" ] && [ -z "${REPLIT_DEPLOYMENT:-}" ]; then
  exit 0
fi

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 0

# Override in Replit Secrets if the store lives elsewhere.
store="${PAXEL_STORE:-github.com/sidmmix/paxel-transcripts}"

curl -fsSL --proto '=https' --tlsv1.2 --connect-timeout 10 --max-time 120 \
  'https://paxel.ycombinator.com/paxel.sh' \
  | PAXEL_STORE="$store" bash -s -- setup --yes \
  || true

exit 0
