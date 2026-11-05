---
name: Paxel history coverage
description: Full-history reporting requires both Git coverage and correctly attributed agent transcripts.
---

Verify Git commit selection separately from agent transcript availability before claiming Paxel captured the entire development history. Do not use an unrestricted all-project upload to bypass a failed repository-scoped transcript match.

**Why:** A scoped run can have complete local Git history but no matching agent sessions. A remote Cursor connection does not establish that its full historical transcripts are available on the remote box.

**How to apply:** Check transcript coverage and repository attribution first. Use no date cutoff for full-history requests and allow headroom in the commit limit: automatic checkpoints can increase the branch count, causing a previously exact cap to exclude the oldest commits. Distinguish verified local selection from a completed Paxel analysis/upload.
