import {
  BAND_WIDTH,
  BILLING_MULTIPLIER,
  CAUSE_THRESHOLDS,
  MAX_DELIVERY_LEAK,
  SCOPE_SHARE,
  DEFAULT_TARGET_MARGIN_PERCENT,
} from "./constants";
import type { LeakInput, LeakResult } from "./types";

/**
 * Pure, deterministic leak engine. No model calls, dates, or randomness.
 * Fee and staff cost cover the same entered period; months are context only.
 * Delivery exposure is capped at 30% of the period fee for every input.
 */
export function computeLeak(input: LeakInput): LeakResult {
  const { fee, staffcost, scopemove, scopebilled, hourstracked } = input;
  const targetMarginPercent = input.targetMarginPercent ?? DEFAULT_TARGET_MARGIN_PERCENT;
  const staffCostCeiling = (100 - targetMarginPercent) / 100;

  const staffsharepct = staffcost / fee;
  const rawBase = Math.max(0, staffcost - fee * staffCostCeiling);
  const deliveryleakraw = rawBase;
  const deliveryleakcap = fee * MAX_DELIVERY_LEAK;
  const deliveryleak = Math.min(deliveryleakraw, deliveryleakcap);
  const deliverycapped = deliveryleakraw > deliveryleakcap;

  const share = SCOPE_SHARE[scopemove];
  const mult = BILLING_MULTIPLIER[scopebilled];
  const scopemid = (share.low + share.high) / 2;
  const scopeleak = fee * scopemid * mult;
  const scopelow = fee * share.low * mult;
  const scopehigh = fee * share.high * mult;
  const hideScopeBlock =
    scopemove === "none" && scopebilled === "billed" && scopeleak <= 0;

  const larger = Math.max(deliveryleak, scopeleak);
  const smaller = Math.min(deliveryleak, scopeleak);
  const leakpoint = larger + smaller / 2;

  const bandwidth = BAND_WIDTH[hourstracked];
  const leaklow = leakpoint * (1 - bandwidth);
  const leakhigh = leakpoint * (1 + bandwidth);

  const requiredfeeAtNorm = staffcost / staffCostCeiling;
  const feeshortfall = Math.max(0, requiredfeeAtNorm - fee);
  const requiredfee = requiredfeeAtNorm;

  let cause: string;
  if (staffsharepct > CAUSE_THRESHOLDS.staffShareOverride) {
    cause = "staff cost is above 80% of the fee";
  } else if (deliveryleak > scopeleak * CAUSE_THRESHOLDS.dominanceRatio) {
    cause = "delivery-cost exposure is the larger modelled component";
  } else if (scopeleak > deliveryleak * CAUSE_THRESHOLDS.dominanceRatio) {
    cause = "scope exposure is the larger modelled component";
  } else if (feeshortfall > 0) {
    cause = "the fee is below the selected staff-cost margin target";
  } else {
    cause = "delivery and scope contribute to the modelled exposure";
  }

  const noLeak = leakpoint <= 0;
  const driver: "delivery" | "scope" =
    deliveryleak >= scopeleak ? "delivery" : "scope";

  return {
    input,
    noLeak,
    driver,
    deliveryleak,
    deliveryleakraw,
    deliverycapped,
    scopeleak,
    scopelow,
    scopehigh,
    hideScopeBlock,
    leakpoint,
    leaklow,
    leakhigh,
    leakpctlow: fee > 0 ? leaklow / fee : 0,
    leakpcthigh: fee > 0 ? leakhigh / fee : 0,
    leakpctmid: fee > 0 ? leakpoint / fee : 0,
    staffsharepct,
    grossmarginpct: 1 - staffsharepct,
    requiredfee,
    feeshortfall,
    cause,
    bandwidth,
  };
}
