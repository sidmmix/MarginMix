/**
 * decisionTable.ts - Verdict Logic with Strict Rule Precedence
 * 
 * Implements verdicts using strict rule precedence:
 * 
 * OVERRIDES (highest priority):
 * 1. High Workforce Intensity + High Coordination Entropy → Structurally Fragile
 * 2. Negative Confidence Signal → Do Not Proceed Without Repricing
 * 
 * PRIMARY RULES:
 * 3. High Commercial Exposure → Price Sensitive
 * 4. High Workforce Intensity → Execution Heavy
 * 
 * DEFAULT:
 * 5. No High-Risk Conditions → Structurally Safe
 * 
 * Verdict logic is isolated in this file.
 */

import { Dimensions, Verdict, VerdictResult } from "./types";

export function decideVerdict(d: Dimensions): VerdictResult {
  const triggeredBy: string[] = [];

  if (d.workforceIntensity === "high" && d.coordinationEntropy === "high") {
    triggeredBy.push("STRUCTURAL_OVERLOAD");
    return {
      verdict: "Structurally Fragile",
      reason: "Structural load exceeds safe operating assumptions. High workforce intensity combined with high coordination entropy creates unsustainable margin pressure.",
      triggeredBy
    };
  }

  if (d.confidenceSignal === "negative") {
    triggeredBy.push("LOW_CONFIDENCE");
    return {
      verdict: "Do Not Proceed Without Repricing",
      reason: "Pricing or delivery confidence is insufficient to proceed safely. Engagement requires repricing or structural changes before commitment.",
      triggeredBy
    };
  }

  if (d.commercialExposure === "high") {
    triggeredBy.push("HIGH_COMMERCIAL_EXPOSURE");
    return {
      verdict: "Price Sensitive",
      reason: "Pricing assumptions require protection. High scope elasticity or pricing rigidity creates commercial vulnerability.",
      triggeredBy
    };
  }

  if (d.workforceIntensity === "high") {
    triggeredBy.push("HIGH_WORKFORCE_INTENSITY");
    return {
      verdict: "Execution Heavy",
      reason: "Execution and coordination will dominate effort. Senior dependency and iteration load require elevated management attention.",
      triggeredBy
    };
  }

  return {
    verdict: "Structurally Safe",
    reason: "Engagement viable under stated assumptions. No high-risk conditions triggered. Proceed with standard governance.",
    triggeredBy: ["NO_HIGH_RISK_CONDITIONS"]
  };
}
