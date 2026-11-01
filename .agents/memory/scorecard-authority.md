---
name: Scorecard authority
description: The supplied scorecard governs calculations; the sample score is not a universal target.
---

Use the user's latest Model1 scorecard as the authority for question points, signal groups and aggregation. Its updated example uses Q9 ongoing under six months (50 points) and yields composite 55. The earlier 51.7 example used Q9 ongoing six to twelve months (0 points); formulas and weights are unchanged.

**Why:** The user supplied a revised scorecard example; its Q9 answer changes the example result without changing any scoring rule.

**How to apply:** Calculate from actual answers using deterministic code. Keep both Q9 stage mappings exact; treat 55 as a regression expectation only for the updated example answers, never a forced target for other engagements. AI prose must not introduce numerical claims.

Keep obsolete alternative main-assessment scorers and invented margin-loss/effort-allocation helpers retired rather than retaining a second calculation path.

**Why:** Parallel scoring implementations and old reference PDFs can reintroduce results that contradict the authoritative scorecard.

**How to apply:** Extend Model1 and its regression coverage when changing the main assessment. This rule does not authorize changing the independent homepage quick profiler.

For report-output-only work, do not change scoring arithmetic, signal mapping, dimension weights, band boundaries, or the override threshold. These safeguards apply to every risk classification, not just ytx. Make one change at a time and show the ytx output after each. The ytx regression fixture must retain a composite of 55; if a change moves it, stop and tell the user which change caused it instead of proceeding.

**Why:** The user explicitly requires report changes to preserve the established ytx result and leave the scoring engine unchanged.

**How to apply:** Compare the ytx output before and after each report change. Verify reporting preserves the engine output for all verdicts and confidence-override cases. Treat 55 as a regression expectation for the saved ytx answers only, never as a hardcoded score or a target for other answers.

Report group descriptions must use the group's numeric score, reporting band, and rank among all five groups. Reporting bands are Low below 25, Medium from 25 to below 50, Elevated from 50 to below 75, and High from 75 through 100. Include a relative role and a comparison naming the highest and lowest scoring groups.

**Why:** The user requires descriptions that cannot contradict the numbers, and clarified that 25 is Medium rather than Low.

**How to apply:** Keep these presentation bands separate from engine verdict boundaries and confidence rules. Derive report text deterministically; never let AI recalculate scores or invent group rankings.

The report name is "AI Substitution and Measurement Risk"; higher scores mean greater risk. Renaming must not invert or otherwise change the calculation. Flags for unclear AI substitution alongside expected replaced hours are explanatory only and must not change scores or verdicts.

**Why:** The user explicitly requires the ytx AI group to remain 100 and its composite to remain 55 while correcting report labels and flagging contradictory answers.

**How to apply:** Preserve the existing scorecard, weights and signal mapping. Quote both submitted answers in the advisory flag. Render verdict provenance from recorded engine metadata, never infer an override from a verdict-band identifier; preserve all existing override conditions and thresholds.
