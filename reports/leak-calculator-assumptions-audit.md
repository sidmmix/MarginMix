# MarginMix Leak Calculator — Assumptions Audit

**Subsequent decision:** The product owner explicitly approved the period-total package, including removal of both extra multipliers, an unconditional 30% delivery cap, and the acceptance values below. The audit findings that follow describe the pre-change engine; the follow-on calculator work implements the approved recommendation. The combination rule, category bands, billing multipliers, and sensitivity widths remain unchanged.

## Status and scope

Audit only. No calculator arithmetic, combined-indicator rule, acceptance-test expectations, customer-facing labels, analytics, or website content was changed.

The source is the attached Complete Replit Agent Build Plan and the current local calculator implementation. This audit does not claim that the production deployment was independently matched to the workspace.

## Executive recommendation — requires approval

Treat fee and staff cost as **totals for the same engagement period**, as the input labels and build plan explicitly instruct:

1. Do not multiply already-period-total delivery exposure or fee uplift by months.
2. Do not multiply the scope percentage by the separate fixed factor of three.
3. Apply the 30%-of-fee delivery-exposure cap consistently, not only when staff cost reaches 100% of fee.
4. Preserve the existing combined-indicator formula: larger exposure plus half the smaller exposure. Keep the agreed overlap disclosure.
5. Preserve the existing scope category assumptions, billing multipliers, and range widths unless separately approved. These are model assumptions, not verified measurements or calibrated confidence intervals.

This recommendation changes financial outputs. It is not implemented or approved merely by completing this audit.

## 1. Input-period semantics

| Input | Current meaning and use | Audit finding |
|---|---|---|
| Fee | Labelled total engagement fee | Already covers the entered period; not a monthly fee. |
| Staff cost | Labelled total staff cost over the same period as fee | Multiplying a difference between these totals by months repeats the period adjustment. |
| Months | Engagement duration, 1–60 | Currently scales delivery exposure and fee uplift; scope uses a separate fixed factor of three, not months. |
| FTE | Average full-time-equivalent people, fractional values allowed | Does not calculate financial outputs; used for a person-month warning and displayed context. |
| Scope movement | None 0–2%, slight 2–4%, moderate 5–9%, significant 12–20% | Uses the category midpoint, not actual unbilled hours or independently priced scope. |
| Scope billing | Billed 0, partly billed 0.5, unbilled 1 | Multiplies scope exposure only. |
| Hours tracked | Yes ±12%, partly ±20%, no ±30% | Sets a symmetric sensitivity range around the combined indicator; no statistical calibration is demonstrated. |

The staff-cost helper suggests FTE times average fully loaded salary but does not specify whether salary is monthly, annual, or converted into the engagement period. That guidance needs period clarification in the downstream hardening work.

## 2. Current arithmetic versus the build plan

Let F = total fee, C = total staff cost, M = months, c = staff-cost ceiling, p = scope-category midpoint, and b = billing multiplier.

| Output | Current implementation | Recommended period-total treatment |
|---|---|---|
| Staff-cost ceiling | c = 0.60 | c = 1 − selected target margin |
| Raw delivery exposure | max(0, C − F × c) × M | max(0, C − F × c) |
| Delivery cap | Applies only if C / F ≥ 1 | min(raw exposure, 0.30 × F) for all inputs |
| Scope exposure | F × p × b × 3 | F × p × b |
| Combined indicator | max(delivery, scope) + 0.5 × min(delivery, scope) | Unchanged |
| Indicative range | Combined indicator × (1 ± selected width) | Unchanged |
| Required fee uplift | M × max(0, C / c − F) | max(0, C / c − F) |
| Required fee | F + current uplift | C / c, shown as target-required fee; uplift is zero if current fee already meets target |

The scope multiplier is a **fixed factor of three**, even for one- or six-month engagements. Earlier shorthand describing it as duration scaling was imprecise.

## 3. Independently reproduced acceptance values

Both examples use three months, 3.33 FTE, moderate scope, unbilled scope, hours not tracked, and the default 40% target / 60% staff-cost ceiling. Values below are exact dollar amounts rounded for presentation, not the UI's nearest-$1,000 headline rounding.

| Output | A: current engine | A: recommended / plan | B: current engine | B: recommended / plan |
|---|---:|---:|---:|---:|
| Fee | $100,000 | $100,000 | $300,000 | $300,000 |
| Staff cost | $75,000 | $75,000 | $225,000 | $225,000 |
| Staff-cost ceiling amount | $60,000 | $60,000 | $180,000 | $180,000 |
| Delivery exposure | $45,000 | $15,000 | $135,000 | $45,000 |
| Scope exposure | $21,000 | $7,000 | $63,000 | $21,000 |
| Combined indicator | $55,500 | $18,500 | $166,500 | $55,500 |
| Range low | $38,850 | $12,950 | $116,550 | $38,850 |
| Range high | $72,150 | $24,050 | $216,450 | $72,150 |
| Required fee | $175,000 | $125,000 | $525,000 | $375,000 |
| Required fee uplift | $75,000 | $25,000 | $225,000 | $75,000 |
| Staff-cost contribution margin on current fee | 25% | 25% | 25% | 25% |

The document's example values are internally consistent with the recommended period-total equations. They are not consistent with the current engine. Merely changing the old test's inputs to example B would not fix the mismatch.

At a 40% target, C / 0.60 gives a fee that actually reaches that target. The engine's duration-multiplied uplift overshoots it for these examples: $75,000 staff cost against its $175,000 required fee implies approximately 57.14% staff-cost contribution margin, not 40%.

## 4. Additional reproducible findings

### Duration changes outputs despite unchanged period totals

For F = $100,000 and C = $75,000, moderate unbilled scope:

| Months | Current delivery exposure | Current scope exposure | Current combined indicator | Current required fee |
|---|---:|---:|---:|---:|
| 1 | $15,000 | $21,000 | $28,500 | $125,000 |
| 3 | $45,000 | $21,000 | $55,500 | $175,000 |
| 6 | $90,000 | $21,000 | $100,500 | $250,000 |

A monthly-input interpretation does not resolve this consistently: it would require explicitly normalizing fee and cost to the same period and updating labels and denominators. The current input contract does not ask for monthly amounts.

### The cap is conditional and discontinuous

For a $100,000 fee, three months, and no billed scope movement:

- Staff cost $99,999 produces **$119,997 delivery exposure**, uncapped.
- Staff cost $100,000 produces **$30,000 delivery exposure**, capped.

An additional $1 of cost therefore reduces the reported exposure by $89,997. The build plan describes an unconditional 30% cap, which avoids that discontinuity. The recommended cap treatment requires approval along with the period-total changes.

### “None” does not always mean zero scope exposure

The “none” category spans 0–2%; its midpoint is 1%. With an unbilled selection, this creates a positive modelled scope amount even when the user selected no scope movement. The plan retains this band, so this audit does not recommend silently changing it. Its intended meaning needs to be explained or separately revised.

### Financial assurance and validation limits

- The 60% ceiling is an assumption, not a demonstrated universal industry norm.
- The 4–6% comparison has hardcoded constants but no supporting source, population, period, or leakage definition in the inspected calculation path.
- One minus staff cost divided by fee is a staff-cost contribution measure; it excludes non-labour direct delivery costs.
- The combined indicator discounts overlap heuristically; its half-weight is not an empirically established de-duplication of actual losses.
- Current enum validation checks presence, not membership. Unexpected truthy scope values can reach calculation code and fail.
- The pure calculation function assumes validated inputs; it does not independently reject non-finite or invalid numeric values.
- Validation permits fractional months, while the browser field requests whole months.
- The low person-month warning triggers below 0.5, while its message says less than one person-month.
- Binary floating-point artifacts occur in raw values, such as $21,000.000000000004. Acceptance checks should use an explicitly chosen tolerance or rounding policy; headline rounding must remain separate from calculation precision.

These findings belong to the already-planned calculator-hardening work, not additional parallel tasks.

## 5. Decisions already agreed

- Expose target-margin choices from 10% through 50% in 5-percentage-point steps.
- Retain a 40% default, as specified in the build plan.
- Keep the combined indicator visible with an overlap disclosure.
- Keep website architecture and full-assessment/payment work separate from this calculator audit.

## 6. Approval required before arithmetic changes

Approve or reject the following package explicitly:

- Fee and staff cost remain totals for the same entered period.
- Remove the extra month multiplier from delivery exposure and fee uplift.
- Remove the fixed scope multiplier of three.
- Apply the existing 30% delivery cap consistently to all inputs.
- Use the period-total acceptance values in the table above.
- Preserve max-plus-half-min combination, category percentages, billing multipliers, and range widths.

The current “none” scope midpoint remains unchanged unless separately approved. The configurable target margin does not establish that these assumptions are statistically validated.

## 7. Verification and change report

- Executed the existing engine for both examples and independently calculated the period-total equations without editing source files.
- Examined duration sensitivity and the conditional-cap boundary.
- Ran the existing `npm run test:leak`: **6 passed, 0 failed**.
- Passing existing tests proves the implementation matches those tests; it does not resolve the model/specification conflict.
- No engine, UI, or test source changed. No deployment, live-browser verification, or new acceptance validation was performed.

## Source references

- Attached Complete Replit Agent Build Plan: sections 4.1–4.8 and 10.
- `client/src/pages/free-tier-calculator.tsx`: fee, duration, FTE, and staff-cost input labels and submission.
- `shared/leak-engine/compute-leak.ts`: current formulas and conditional cap.
- `shared/leak-engine/constants.ts`: fixed target, scope scale, category bands, multipliers, range widths, and warning thresholds.
- `shared/leak-engine/validate-input.ts`: validation and warning behavior.
- `shared/leak-engine/format.ts`: currency and headline display rounding.
- `shared/leak-engine/compute-leak.test.ts`: current acceptance expectations.
- `shared/leak-engine/comparison-line.ts`: unsupported industry-comparison output.
- `client/src/pages/free-tier-calculator-output.tsx`: current customer-facing interpretations.
