import assert from "node:assert/strict";
import test from "node:test";
import { computeLeak, LEAK_RESULT_STORAGE_KEY, type LeakInput } from "@shared/leak-engine";
import { clearSessionLeakEstimates, LEAK_ESTIMATES_STORAGE_KEY, readStoredLeakEstimates } from "./leak-estimates";

const input: LeakInput = {
  currency: "USD",
  fee: 100_000,
  months: 6,
  fte: 2,
  staffcost: 50_000,
  targetMarginPercent: 40,
  scopemove: "moderate",
  scopebilled: "partly_billed",
  hourstracked: "partly",
};

test("reads and recalculates valid estimates while preserving labels", () => {
  const expected = computeLeak(input);
  const estimates = readStoredLeakEstimates(
    JSON.stringify([{ label: "  Northstar  ", result: expected }]),
  );

  assert.equal(estimates.length, 1);
  assert.equal(estimates[0].label, "Northstar");
  assert.deepEqual(estimates[0].result, expected);
});

test("uses safe default labels and drops invalid estimates", () => {
  const estimates = readStoredLeakEstimates(
    JSON.stringify([
      { result: computeLeak(input) },
      { label: "Invalid", result: { input: { ...input, fee: "bad" } } },
      null,
    ]),
  );

  assert.equal(estimates.length, 1);
  assert.equal(estimates[0].label, "Engagement 1");
});

test("returns an empty list for malformed or non-list storage", () => {
  assert.deepEqual(readStoredLeakEstimates(null), []);
  assert.deepEqual(readStoredLeakEstimates("{broken"), []);
  assert.deepEqual(readStoredLeakEstimates(JSON.stringify({})), []);
});

test("clearing estimates removes both calculator stores and leaves unrelated data", () => {
  const entries = new Map([
    [LEAK_ESTIMATES_STORAGE_KEY, JSON.stringify([{ label: "Sample", result: computeLeak(input) }])],
    [LEAK_RESULT_STORAGE_KEY, JSON.stringify(computeLeak(input))],
    ["cookie-consent", "accepted"],
  ]);
  clearSessionLeakEstimates({ removeItem: (key) => { entries.delete(key); } });
  assert.equal(entries.has(LEAK_ESTIMATES_STORAGE_KEY), false);
  assert.equal(entries.has(LEAK_RESULT_STORAGE_KEY), false);
  assert.equal(entries.get("cookie-consent"), "accepted");
  clearSessionLeakEstimates({ removeItem: (key) => { entries.delete(key); } });
  assert.equal(entries.size, 1);
});

test("clearing estimates reports storage failures instead of claiming success", () => {
  assert.throws(() => clearSessionLeakEstimates({
    removeItem: () => { throw new Error("Storage unavailable"); },
  }), /Storage unavailable/);
});
