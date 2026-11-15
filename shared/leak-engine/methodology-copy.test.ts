import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { leakEstimateMethodologyCopy } from "./methodology-copy";

const entryPage = readFileSync("client/src/pages/free-tier-calculator.tsx", "utf8");
const resultsPage = readFileSync("client/src/pages/free-tier-calculator-output.tsx", "utf8");

test("entry and results pages render the same estimate methodology", () => {
  for (const field of ["model", "scope", "combined", "period", "limits"] as const) {
    assert.ok(
      entryPage.includes(`leakEstimateMethodologyCopy.${field}`),
      `entry page must render the shared ${field} explanation`,
    );
    assert.ok(
      resultsPage.includes(`leakEstimateMethodologyCopy.${field}`),
      `results page must render the shared ${field} explanation`,
    );
  }

  assert.ok(entryPage.includes("leakEstimateMethodologyCopy.range"));
  assert.match(resultsPage, /leakEstimateSensitivityCopy\(hours\)/);
  assert.match(
    readFileSync("shared/leak-engine/methodology-copy.ts", "utf8"),
    /leakEstimateMethodologyCopy\.range/,
  );
  assert.match(resultsPage, /scopeAssumptionCopy\(result\)/);
});

test("shared methodology reflects the calculator assumptions and limitations", () => {
  assert.match(leakEstimateMethodologyCopy.model, /capped at 30% of the period fee/);
  assert.match(leakEstimateMethodologyCopy.scope, /none 0%–2%/);
  assert.match(leakEstimateMethodologyCopy.scope, /slight 2%–4%/);
  assert.match(leakEstimateMethodologyCopy.scope, /moderate 5%–9%/);
  assert.match(leakEstimateMethodologyCopy.scope, /significant 12%–20%/);
  assert.match(leakEstimateMethodologyCopy.scope, /billed 0%/);
  assert.match(leakEstimateMethodologyCopy.scope, /partly billed 50%/);
  assert.match(leakEstimateMethodologyCopy.scope, /unbilled 100%/);
  assert.match(leakEstimateMethodologyCopy.combined, /larger.*plus half the smaller.*overlap/i);
  assert.match(leakEstimateMethodologyCopy.range, /tracked ±12%.*partly tracked ±20%.*not tracked ±30%/);
  assert.match(leakEstimateMethodologyCopy.range, /not a statistical confidence interval/);
  assert.match(leakEstimateMethodologyCopy.limits, /planning estimate, not audited loss or recovered revenue/);
  assert.match(leakEstimateMethodologyCopy.limits, /not been calibrated against actual engagement outcomes/);
});
