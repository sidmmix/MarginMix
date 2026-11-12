import assert from "node:assert/strict";
import { test } from "node:test";
import { computeLeak } from "./compute-leak";
import {
  formatCurrency,
  formatCurrencyBandHeadline,
  formatPercent,
  formatUsd,
  formatUsdBandHeadline,
} from "./format";
import { validateLeakInput } from "./validate-input";
import { readStoredLeakResult } from "./stored-result";
import {
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  TARGET_MARGIN_OPTIONS,
  DEFAULT_TARGET_MARGIN_PERCENT,
} from "./constants";
import type { LeakInput } from "./types";

const EXAMPLE_A: LeakInput = {
  fee: 100_000, months: 3, fte: 3.33, staffcost: 75_000,
  targetMarginPercent: 40,
  scopemove: "moderate", scopebilled: "unbilled", hourstracked: "no",
};

function near(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
}

test("approved period-total example A", () => {
  const r = computeLeak(EXAMPLE_A);
  assert.equal(r.deliveryleak, 15_000);
  near(r.scopeleak, 7_000);
  assert.equal(r.leakpoint, 18_500);
  assert.equal(r.leaklow, 12_950);
  assert.equal(r.leakhigh, 24_050);
  assert.equal(r.requiredfee, 125_000);
  assert.equal(r.feeshortfall, 25_000);
  assert.equal(r.grossmarginpct, 0.25);
});

test("approved period-total example B", () => {
  const r = computeLeak({ ...EXAMPLE_A, fee: 300_000, staffcost: 225_000 });
  assert.equal(r.deliveryleak, 45_000);
  near(r.scopeleak, 21_000);
  assert.equal(r.leakpoint, 55_500);
  assert.equal(r.leaklow, 38_850);
  assert.equal(r.leakhigh, 72_150);
  assert.equal(r.requiredfee, 375_000);
  assert.equal(r.feeshortfall, 75_000);
});

test("months and FTE do not multiply period-total monetary outputs", () => {
  const baseline = computeLeak(EXAMPLE_A);
  for (const months of [1, 3, 6, 12, 60]) {
    const r = computeLeak({ ...EXAMPLE_A, months, fte: 10 });
    for (const key of ["deliveryleak", "scopeleak", "leakpoint", "leaklow", "leakhigh", "requiredfee", "feeshortfall"] as const) {
      assert.equal(r[key], baseline[key], `${key} changes with duration`);
    }
  }
});

test("all nine target options derive the staff-cost ceiling and fee requirement", () => {
  assert.deepEqual(TARGET_MARGIN_OPTIONS, [10, 15, 20, 25, 30, 35, 40, 45, 50]);
  assert.equal(DEFAULT_TARGET_MARGIN_PERCENT, 40);
  for (const targetMarginPercent of TARGET_MARGIN_OPTIONS) {
    const r = computeLeak({ ...EXAMPLE_A, targetMarginPercent });
    const ceiling = (100 - targetMarginPercent) / 100;
    near(r.deliveryleak, Math.min(30_000, Math.max(0, 75_000 - 100_000 * ceiling)));
    near(r.requiredfee, 75_000 / ceiling);
    near(r.feeshortfall, Math.max(0, 75_000 / ceiling - 100_000));
    assert.equal(validateLeakInput({ ...EXAMPLE_A, targetMarginPercent }).valid, true);
  }
  const legacy = computeLeak({ ...EXAMPLE_A, targetMarginPercent: undefined });
  assert.equal(legacy.deliveryleak, 15_000);
  assert.equal(legacy.requiredfee, 125_000);
});

test("delivery cap applies consistently before and after staff cost reaches fee", () => {
  for (const [staffcost, expected, capped] of [
    [60_000, 0, false], [89_999, 29_999, false],
    [90_000, 30_000, false], [99_999, 30_000, true],
    [100_000, 30_000, true], [300_000, 30_000, true],
  ] as const) {
    const r = computeLeak({ ...EXAMPLE_A, staffcost });
    assert.equal(r.deliveryleak, expected);
    assert.equal(r.deliverycapped, capped);
  }
});

test("scope bands and billing factors are unchanged, with no extra multiplier", () => {
  const categories = {
    none: [0, 0.02], slight: [0.02, 0.04],
    moderate: [0.05, 0.09], significant: [0.12, 0.2],
  } as const;
  const billing = { billed: 0, partly_billed: 0.5, unbilled: 1 } as const;
  for (const scopemove of Object.keys(categories) as (keyof typeof categories)[]) {
    for (const scopebilled of Object.keys(billing) as (keyof typeof billing)[]) {
      const r = computeLeak({ ...EXAMPLE_A, scopemove, scopebilled });
      const [low, high] = categories[scopemove];
      const factor = billing[scopebilled];
      near(r.scopeleak, 100_000 * ((low + high) / 2) * factor);
      near(r.scopelow, 100_000 * low * factor);
      near(r.scopehigh, 100_000 * high * factor);
    }
  }
});

test("combined indicator preserves max-plus-half-min in both driver directions", () => {
  for (const input of [
    EXAMPLE_A,
    { ...EXAMPLE_A, staffcost: 61_000, scopemove: "significant" as const },
  ]) {
    const r = computeLeak(input);
    assert.equal(r.leakpoint, Math.max(r.deliveryleak, r.scopeleak) + Math.min(r.deliveryleak, r.scopeleak) / 2);
    assert.equal(r.driver, r.deliveryleak >= r.scopeleak ? "delivery" : "scope");
  }
});

test("zero exposure and zero uplift remain valid without implying verified loss", () => {
  const r = computeLeak({ ...EXAMPLE_A, staffcost: 50_000, scopemove: "none", scopebilled: "billed" });
  assert.equal(r.deliveryleak, 0);
  assert.equal(r.scopeleak, 0);
  assert.equal(r.hideScopeBlock, true);
  assert.equal(r.noLeak, true);
  assert.equal(r.feeshortfall, 0);
  near(r.requiredfee, 50_000 / 0.6);
});

test("none plus unbilled retains the approved one-percent scope midpoint", () => {
  const r = computeLeak({ ...EXAMPLE_A, staffcost: 50_000, scopemove: "none" });
  assert.equal(r.scopeleak, 1_000);
  assert.equal(r.noLeak, false);
});

test("hours tracking preserves the three symmetric sensitivity widths", () => {
  const widths = { yes: 0.12, partly: 0.2, no: 0.3 } as const;
  for (const hourstracked of Object.keys(widths) as (keyof typeof widths)[]) {
    const r = computeLeak({ ...EXAMPLE_A, hourstracked });
    near(r.leaklow, r.leakpoint * (1 - widths[hourstracked]));
    near(r.leakhigh, r.leakpoint * (1 + widths[hourstracked]));
    near(r.leakpctmid, r.leakpoint / EXAMPLE_A.fee);
  }
});

test("numeric validation accepts boundaries and rejects non-finite or out-of-range values", () => {
  for (const months of [1, 60]) {
    for (const fte of [0.1, 200]) {
      assert.equal(validateLeakInput({ ...EXAMPLE_A, months, fte }).valid, true);
    }
  }
  for (const [field, values] of [
    ["fee", [0, -1, NaN, Infinity]], ["staffcost", [0, -1, NaN, Infinity]],
    ["months", [0, 1.5, 61, NaN, Infinity]], ["fte", [0.09, 201, NaN, Infinity]],
    ["targetMarginPercent", [9, 11, 42, 51, NaN, Infinity]],
  ] as const) {
    for (const value of values) {
      const r = validateLeakInput({ ...EXAMPLE_A, [field]: value });
      assert.equal(r.valid, false, `${field}=${value}`);
      assert.ok(r.errors[field]);
    }
  }
});

test("categorical validation rejects missing, unknown, and prototype-property choices", () => {
  for (const field of ["scopemove", "scopebilled", "hourstracked"] as const) {
    for (const value of [undefined, "", "unknown", "toString", "__proto__"]) {
      const r = validateLeakInput({ ...EXAMPLE_A, [field]: value } as Partial<LeakInput>);
      assert.equal(r.valid, false);
      assert.ok(r.errors[field]);
    }
  }
});

test("warning boundaries are non-blocking and match their messages", () => {
  assert.equal(validateLeakInput({ ...EXAMPLE_A, staffcost: 300_000 }).warnings.length, 0);
  assert.equal(validateLeakInput({ ...EXAMPLE_A, staffcost: 10_000 }).warnings.length, 0);
  assert.ok(validateLeakInput({ ...EXAMPLE_A, staffcost: 300_001 }).warnings.some(w => w.includes("three times")));
  assert.ok(validateLeakInput({ ...EXAMPLE_A, staffcost: 9_999 }).warnings.some(w => w.includes("under a tenth")));
  const small = validateLeakInput({ ...EXAMPLE_A, months: 1, fte: 0.1 });
  assert.equal(small.valid, true);
  assert.ok(small.warnings.some(w => w.includes("half a person-month")));
  assert.equal(validateLeakInput({ ...EXAMPLE_A, months: 1, fte: 0.5 }).warnings.length, 0);
});

test("display rounding does not change arithmetic or imply extra precision", () => {
  const r = computeLeak(EXAMPLE_A);
  assert.equal(r.leaklow, 12_950);
  assert.equal(formatUsdBandHeadline(r.leaklow), "$13,000");
  assert.equal(formatUsdBandHeadline(r.leakhigh), "$24,000");
  assert.equal(formatUsd(25_000), "$25,000");
  assert.equal(formatPercent(0.185, 1), "18.5%");
});

test("selected currency changes denomination only, never the leak calculation", () => {
  assert.deepEqual(CURRENCY_OPTIONS, ["USD", "SGD", "MYR"]);
  assert.equal(DEFAULT_CURRENCY, "USD");
  const usd = computeLeak({ ...EXAMPLE_A, currency: "USD" });
  for (const currency of ["SGD", "MYR"] as const) {
    const result = computeLeak({ ...EXAMPLE_A, currency });
    assert.equal(result.input.currency, currency);
    for (const key of [
      "deliveryleak", "scopeleak", "leakpoint", "leaklow", "leakhigh",
      "requiredfee", "feeshortfall",
    ] as const) {
      assert.equal(result[key], usd[key], `${key} changed for ${currency}`);
    }
  }
});

test("currency formatters identify the selected ISO currency code", () => {
  assert.equal(formatCurrency(25_000, "USD"), "USD 25,000");
  assert.equal(formatCurrency(25_000, "SGD"), "SGD 25,000");
  assert.equal(formatCurrency(25_000, "MYR"), "MYR 25,000");
  assert.equal(formatCurrencyBandHeadline(12_950, "MYR"), "MYR 13,000");
});

test("identical inputs produce identical outputs across repeated runs", () => {
  const expected = JSON.stringify(computeLeak(EXAMPLE_A));
  for (let i = 0; i < 10; i++) assert.equal(JSON.stringify(computeLeak(EXAMPLE_A)), expected);
});

test("high staff-cost share is described without claiming cost exceeds the fee", () => {
  const r = computeLeak({ ...EXAMPLE_A, staffcost: 85_000 });
  assert.equal(r.cause, "staff cost is above 80% of the fee");
  assert.ok(r.input.staffcost < r.input.fee);
});

test("stored results are validated and recalculated rather than trusting obsolete totals", () => {
  const saved = JSON.stringify({ input: EXAMPLE_A, leakpoint: 55_500, deliveryleak: 45_000 });
  assert.equal(readStoredLeakResult(saved)?.leakpoint, 18_500);
  assert.equal(readStoredLeakResult(saved)?.input.currency, DEFAULT_CURRENCY);
  assert.equal(
    readStoredLeakResult(JSON.stringify({ input: { ...EXAMPLE_A, currency: "SGD" } }))?.input.currency,
    "SGD",
  );
  assert.equal(readStoredLeakResult(null), null);
  assert.equal(readStoredLeakResult("{broken"), null);
  assert.equal(readStoredLeakResult("null"), null);
  assert.equal(readStoredLeakResult("{}"), null);
  assert.equal(readStoredLeakResult(JSON.stringify({ input: { ...EXAMPLE_A, fte: "bad" } })), null);
  assert.equal(readStoredLeakResult(JSON.stringify({ input: { ...EXAMPLE_A, scopemove: "unknown" } })), null);
});

test("currency validation accepts supported codes and rejects unknown codes", () => {
  for (const currency of CURRENCY_OPTIONS) {
    assert.equal(validateLeakInput({ ...EXAMPLE_A, currency }).valid, true);
  }
  const invalid = validateLeakInput({ ...EXAMPLE_A, currency: "EUR" as never });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.currency);
});
