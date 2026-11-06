import {
  BAND_WIDTH,
  BILLING_MULTIPLIER,
  CAUSE_THRESHOLDS,
  MAX_DELIVERY_LEAK,
  SCOPE_LEAK_SCALE,
  SCOPE_SHARE,
  STAFFCOST_NORM,
} from "./constants";
import type { LeakInput, LeakResult } from "./types";

/**
 * Pure, deterministic leak engine. No model calls, dates, or randomness.
 * Delivery overrun scales with engagement months; fee shortfall uses the same period.
 * Delivery cap applies only when staff cost is at or above the full fee.
 */
export function computeLeak(input: LeakInput): LeakResult {
  const { fee, months, staffcost, scopemove, scopebilled, hourstracked } = input;

  const staffsharepct = staffcost / fee;
  const rawBase = Math.max(0, staffcost - fee * STAFFCOST_NORM);
  const deliveryleakraw = rawBase * months;
  const deliveryleakcap = fee * MAX_DELIVERY_LEAK;
  let deliveryleak = deliveryleakraw;
  let deliverycapped = false;
  if (staffsharepct >= 1) {
    deliveryleak = Math.min(deliveryleakraw, deliveryleakcap);
    deliverycapped = deliveryleakraw > deliveryleakcap;
  }

  const share = SCOPE_SHARE[scopemove];
  const mult = BILLING_MULTIPLIER[scopebilled];
  const scopemid = (share.low + share.high) / 2;
  const scopeleak = fee * scopemid * mult * SCOPE_LEAK_SCALE;
  const scopelow = fee * share.low * mult * SCOPE_LEAK_SCALE;
  const scopehigh = fee * share.high * mult * SCOPE_LEAK_SCALE;
  const hideScopeBlock =
    scopemove === "none" && scopebilled === "billed" && scopeleak <= 0;

  const larger = Math.max(deliveryleak, scopeleak);
  const smaller = Math.min(deliveryleak, scopeleak);
  const leakpoint = larger + smaller / 2;

  const bandwidth = BAND_WIDTH[hourstracked];
  const leaklow = leakpoint * (1 - bandwidth);
  const leakhigh = leakpoint * (1 + bandwidth);

  const requiredfeeAtNorm = staffcost / STAFFCOST_NORM;
  const feeshortfall = months * Math.max(0, requiredfeeAtNorm - fee);
  const requiredfee = fee + feeshortfall;

  let cause: string;
  if (staffsharepct > CAUSE_THRESHOLDS.staffShareOverride) {
    cause = "priced below what the team costs";
  } else if (deliveryleak > scopeleak * CAUSE_THRESHOLDS.dominanceRatio) {
    cause = "delivery cost is outrunning the fee";
  } else if (scopeleak > deliveryleak * CAUSE_THRESHOLDS.dominanceRatio) {
    cause = "unbilled scope";
  } else if (feeshortfall > 0) {
    cause = "the fee was set below a workable margin at signature";
  } else {
    cause = "delivery and scope are leaking together";
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
