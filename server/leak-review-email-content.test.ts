import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildLeakReviewEngagementRows } from "./leak-review-email-content";
import { leakEstimateMethodologyCopy } from "../shared/leak-engine/methodology-copy";

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
    "larger of the delivery and scope estimates plus half the smaller",
    "±30%",
    "not a statistical confidence interval",
    "Fee and staff cost cover the same entered period",
    "not audited loss or recovered revenue",
    "excludes other non-labour direct costs",
    "not been calibrated against actual engagement outcomes",
  ]) {
    assert.ok(html.includes(expected), `email summary must include ${expected}`);
  }
});

test("internal and confirmation emails both include the shared assumptions", () => {
  const resendSource = readFileSync("server/resend.ts", "utf8");
  const emailRowsBuilderCalls = resendSource.match(/buildLeakReviewEngagementRows\(contact\.engagement\)/g) ?? [];
  assert.equal(emailRowsBuilderCalls.length, 1);

  const methodology = [
    leakEstimateMethodologyCopy.model,
    leakEstimateMethodologyCopy.scope,
    leakEstimateMethodologyCopy.combined,
    leakEstimateMethodologyCopy.period,
    leakEstimateMethodologyCopy.limits,
  ];
  const rows = buildLeakReviewEngagementRows({
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

  for (const line of methodology) {
    assert.ok(rows.includes(line), `shared email rows must include ${line}`);
  }

  assert.equal((resendSource.match(/\$\{engagementRows\}/g) ?? []).length, 2);
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
