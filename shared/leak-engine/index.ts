export * from "./constants";
export type { LeakInput, LeakResult } from "./types";
export type { HoursTracked, ScopeBilled, ScopeMove } from "./constants";
export { computeLeak } from "./compute-leak";
export { validateLeakInput } from "./validate-input";
export { buildComparisonLine } from "./comparison-line";
export {
  formatUsd,
  formatUsdBandHeadline,
  formatPercent,
  formatPercentRange,
  staffNormLabel,
  grossMarginNormLabel,
} from "./format";

export const LEAK_RESULT_STORAGE_KEY = "marginmix_free_tier_leak_result";

export const SCOPE_MOVE_LABELS: Record<
  import("./constants").ScopeMove,
  string
> = {
  none: "No scope movement",
  slight: "Slight creep",
  moderate: "Moderate creep",
  significant: "Significant creep",
};

export const SCOPE_BILLED_LABELS: Record<
  import("./constants").ScopeBilled,
  string
> = {
  billed: "Billed",
  partly_billed: "Partly billed",
  unbilled: "Unbilled",
};
