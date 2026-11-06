# Paxel on Replit-only MarginMix

What you have vs what Paxel reads:

| Asset | Paxel upload? | Use for |
|-------|---------------|---------|
| `transcript.jsonl` (Replit Agent) | No | Genesis story, zip bundle, your archive |
| `.agent_state_*.bin` per commit | No | Replit internal; not chat text |
| Git (~860 commits) | Yes (metadata) | Velocity, commit grouping with sessions |
| Cursor `agent-transcripts` | Yes | Steering, planning signals, report body |
| Claude / Codex on Repl | Yes (if you add them) | More sessions = stronger comparisons |

## Best Paxel report possible **today**

1. `bash scripts/paxel-replit-status.sh` — audit session counts.
2. `bash scripts/paxel-replit-upload.sh --commits 1200` — full git window; **do not** pass `--since all`.
3. Accept that the **agent narrative** is mostly **one Cursor session** until you add more.

## Make the **next** reports materially better

Paxel compares patterns across **many supported sessions** (e.g. plan before coding vs not).

1. Work on MarginMix in **Cursor on this Repl** (or install **Claude Code** here and commit from the same repo).
2. Use an explicit **plan → implement** rhythm in chat (write the plan in the thread, then code).
3. Re-run upload after every **5–10** meaningful sessions:
   ```sh
   bash scripts/paxel-replit-upload.sh --commits 1200
   ```
4. After **3+ uploads**, Paxel’s builder profile updates on the dashboard.

`paxel-transcripts` / GitHub store does **not** backfill Replit Agent history; it only syncs **future** Claude/Codex pushes from boxes with `gh` auth.

## What Paxel will **not** do (use companions instead)

- Reconstruct **scratch build** from 860 commits alone → `bash scripts/generate-marginmix-genesis-story.sh`
- Downloadable Replit chat → `bash scripts/bundle-replit-agent-download.sh`
- Readable export → `bash scripts/export-replit-agent-transcript.sh --copy-raw`

## Ask Paxel (product gap)

Email **paxel@ycombinator.com**: Replit-only workflow, `transcript.jsonl` under `.local/state/replit/agent/`, 860-commit repo, 1 Cursor session in report — request **Replit Agent import** or bulk historical ingest.
