import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { computeLeak, type LeakInput } from "@shared/leak-engine";
import LeakEstimateComparison from "./leak-estimate-comparison";

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

test("renders each estimate with its result, assumptions, and indicative caveat", () => {
  const html = renderToStaticMarkup(
    createElement(LeakEstimateComparison, {
      estimates: [
        { label: "Northstar", result: computeLeak(input) },
        {
          label: "Harbor",
          result: computeLeak({ ...input, fee: 180_000, scopemove: "significant" }),
        },
      ],
    }),
  );

  assert.match(html, /Northstar/);
  assert.match(html, /Harbor/);
  assert.equal((html.match(/Indicative estimate/g) ?? []).length, 2);
  assert.match(html, /Inputs and assumptions/);
  assert.match(html, /Delivery-cost exposure compares staff costs/);
  assert.match(html, /Scope assumption:/);
  assert.match(html, /Hours tracking is partly/);
  assert.match(html, /not an audited loss/);
  assert.match(html, /not an additive total/);
});
