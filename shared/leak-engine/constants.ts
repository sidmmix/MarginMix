// Every number the free tier depends on. Nothing here is user data.
// Model assumptions are not measured losses or industry benchmarks.

/** User-selectable target margin percentages; 40% preserves the current default. */
export const TARGET_MARGIN_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50] as const;
export const DEFAULT_TARGET_MARGIN_PERCENT = 40;

/** Guardrail: cap delivery exposure at this share of the total period fee. */
export const MAX_DELIVERY_LEAK = 0.3;

/** Assumed scope exposure as share of the period fee, by scope movement. */
export const SCOPE_SHARE = {
  none: { low: 0.0, high: 0.02 },
  slight: { low: 0.02, high: 0.04 },
  moderate: { low: 0.05, high: 0.09 },
  significant: { low: 0.12, high: 0.2 },
} as const;

export type ScopeMove = keyof typeof SCOPE_SHARE;

/** Share of scope leak that is actually lost, by billing status. */
export const BILLING_MULTIPLIER = {
  billed: 0.0,
  partly_billed: 0.5,
  unbilled: 1.0,
} as const;

export type ScopeBilled = keyof typeof BILLING_MULTIPLIER;

/** Band half-width by hours-tracking quality. */
export const BAND_WIDTH = {
  yes: 0.12,
  partly: 0.2,
  no: 0.3,
} as const;

export type HoursTracked = keyof typeof BAND_WIDTH;

export const CAUSE_THRESHOLDS = {
  staffShareOverride: 0.8,
  dominanceRatio: 1.5,
} as const;

export const INPUT_WARNINGS = {
  staffCostHigh: 3.0,
  staffCostLow: 0.1,
  minPersonMonths: 0.5,
} as const;

export const INPUT_BOUNDS = {
  months: { min: 1, max: 60 },
  fte: { min: 0.1, max: 200 },
} as const;

export const CURRENCY = "USD";
