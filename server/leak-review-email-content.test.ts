import assert from "node:assert/strict";
import { test } from "node:test";
import { buildLeakReviewEngagementRows } from "./leak-review-email-content";

test("review email summary includes calculator inputs and their assumptions", () => {
  const html = buildLeakReviewEngagementRows({
    currency: "USD",
    fee: 100_000,
    months: 3,
    fte: 3,
    staffcost: 60_000,
    targetMarginPercent: 40,
    exposureLow: 8_000,
    exposureHigh: 12_000,
    scopemove: "moderate",
    scopebilled: "unbilled",
    hourstracked: "no",
  });

  for (const expected of [
    "Moderate creep",
    "Unbilled",
    "Not tracked",
    "30% of the period fee",
    "preset ranges as a share of the period fee",
    "±30%",
    "not audited loss or recovered revenue",
  ]) {
    assert.ok(html.includes(expected), `email summary must include ${expected}`);
  }
});

test("review email summary escapes user-controlled engagement labels", () => {
  const html = buildLeakReviewEngagementRows({
    currency: "USD",
    fee: 1,
    months: 1,
    fte: 1,
    staffcost: 0,
    targetMarginPercent: 40,
    exposureLow: 0,
    exposureHigh: 0,
    scopemove: "none",
    scopebilled: "billed",
    hourstracked: "yes",
  });

  assert.ok(html.includes("Fee for entered period:"));
  assert.doesNotMatch(html, /<script>/i);
});
