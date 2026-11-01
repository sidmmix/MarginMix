---
name: Scorecard authority
description: The supplied scorecard governs calculations; the sample score is not a universal target.
---

Use the user's Model1 scorecard as the authority for question points, signal groups and aggregation. The user clarified that 51.7 is an example of how computation should work, irrespective of classification—not a value to force for other answers.

**Why:** The user explicitly requires computations to follow each answer's scorecard classification, with no AI-generated numbers.

**How to apply:** Calculate from actual answers using deterministic code. Treat the sample as a regression fixture only. Do not tune weights or bands to reproduce it for other engagements; AI prose must not introduce numerical claims.

Keep obsolete alternative main-assessment scorers and invented margin-loss/effort-allocation helpers retired rather than retaining a second calculation path.

**Why:** Parallel scoring implementations and old reference PDFs can reintroduce results that contradict the authoritative scorecard.

**How to apply:** Extend Model1 and its regression coverage when changing the main assessment. This rule does not authorize changing the independent homepage quick profiler.

For report-output-only work, do not change scoring arithmetic, signal mapping, dimension weights, band boundaries, or the override threshold. These safeguards apply to every risk classification, not just ytx. Make one change at a time and show the ytx output after each. The ytx regression fixture must retain a composite of 55; if a change moves it, stop and tell the user which change caused it instead of proceeding.

**Why:** The user explicitly requires report changes to preserve the established ytx result and leave the scoring engine unchanged.

**How to apply:** Compare the ytx output before and after each report change. Verify reporting preserves the engine output for all verdicts and confidence-override cases. Treat 55 as a regression expectation for the saved ytx answers only, never as a hardcoded score or a target for other answers.
