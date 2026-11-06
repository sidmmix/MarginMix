import assert from "node:assert/strict";
import { test } from "node:test";
import { buildComparisonLine } from "./comparison-line";
import { computeLeak } from "./compute-leak";
import { formatUsdBandHeadline } from "./format";
import type { LeakInput } from "./types";

const TEST1: LeakInput = {
  fee: 100_000,
  months: 3,
  fte: 3.33,
  staffcost: 75_000,
  scopemove: "moderate",
  scopebilled: "unbilled",
  hourstracked: "no",
};

test("Test 1 — reference case", () => {
  const r = computeLeak(TEST1);
  assert.equal(r.deliveryleak, 45_000);
  assert.ok(Math.abs(r.scopeleak - 21_000) < 1);
  assert.equal(r.leakpoint, 55_500);
  assert.equal(r.leaklow, 38_850);
  assert.equal(r.leakhigh, 72_150);
  assert.equal(r.cause, "delivery cost is outrunning the fee");
  assert.equal(r.feeshortfall, 75_000);
  assert.equal(formatUsdBandHeadline(r.leaklow), "$39,000");
  assert.equal(formatUsdBandHeadline(r.leakhigh), "$72,000");
});

test("Test 2 — no material leak", () => {
  const r = computeLeak({
    fee: 500_000,
    months: 6,
    fte: 4,
    staffcost: 200_000,
    scopemove: "none",
    scopebilled: "billed",
    hourstracked: "yes",
  });
  assert.equal(r.deliveryleak, 0);
  assert.equal(r.scopeleak, 0);
  assert.equal(r.noLeak, true);
  const cmp = buildComparisonLine(r.leakpctlow, r.leakpcthigh);
  assert.equal(cmp.nearNormal, true);
});

test("Test 3 — delivery capped at 30% of fee", () => {
  const r = computeLeak({
    fee: 100_000,
    months: 1,
    fte: 1,
    staffcost: 100_000,
    scopemove: "none",
    scopebilled: "billed",
    hourstracked: "yes",
  });
  assert.equal(r.deliveryleak, 30_000);
  assert.equal(r.deliverycapped, true);
});

test("Test 4 — scope dominant driver", () => {
  const r = computeLeak({
    fee: 1_000_000,
    months: 12,
    fte: 6,
    staffcost: 620_000,
    scopemove: "significant",
    scopebilled: "unbilled",
    hourstracked: "yes",
  });
  assert.ok(r.scopeleak > r.deliveryleak);
  assert.equal(r.driver, "scope");
});

test("Test 5 — determinism (10 runs)", () => {
  const baseline = JSON.stringify(computeLeak(TEST1));
  for (let i = 0; i < 10; i++) {
    assert.equal(JSON.stringify(computeLeak(TEST1)), baseline);
  }
});

test("Test 6 — band width ordering", () => {
  const base = { ...TEST1 };
  const narrow = computeLeak({ ...base, hourstracked: "yes" });
  const mid = computeLeak({ ...base, hourstracked: "partly" });
  const wide = computeLeak({ ...base, hourstracked: "no" });
  const width = (r: ReturnType<typeof computeLeak>) => r.leakhigh - r.leaklow;
  assert.ok(width(narrow) < width(mid));
  assert.ok(width(mid) < width(wide));
});
