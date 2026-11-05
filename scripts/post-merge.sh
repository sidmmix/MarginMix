#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Install exactly the reviewed lockfile without changing dependency versions.
npm ci --no-audit --no-fund
npm run check
npm run build

# Paxel transcript capture (remote box); no-op off Replit.
bash scripts/replit-paxel-setup.sh

# Database changes require separate review; never push a schema automatically.
