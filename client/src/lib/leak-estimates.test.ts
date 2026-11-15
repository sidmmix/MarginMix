import assert from "node:assert/strict";
import test from "node:test";
import { computeLeak, type LeakInput } from "@shared/leak-engine";
import { readStoredLeakEstimates } from "./leak-estimates";

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
