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
