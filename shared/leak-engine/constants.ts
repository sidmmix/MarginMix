// Every number the free tier depends on. Nothing here is user data.
// BENCHMARK-labelled values are industry figures, not this firm's own data.

/** BENCHMARK: staff cost as share of fee at a healthy agency gross margin. */
export const STAFFCOST_NORM = 0.6;

/** Derived; healthy gross margin implied by STAFFCOST_NORM. */
export const GROSS_MARGIN_NORM = 0.4;

/** Guardrail: cap delivery leak at this share of fee when staff share of fee is at or above 100%. */
export const MAX_DELIVERY_LEAK = 0.3;

/**
 * Scales scope mid-point leak to an engagement-period estimate (acceptance calibration).
 * BENCHMARK bands in SCOPE_SHARE are per-fee shares before this scale.
 */
export const SCOPE_LEAK_SCALE = 3;

/** BENCHMARK scope leakage as share of fee, by how far scope moved. */
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

/** BENCHMARK: typical revenue leakage for services firms (comparison line only). */
export const INDUSTRY_LEAK_LOW = 0.04;
export const INDUSTRY_LEAK_HIGH = 0.06;

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
