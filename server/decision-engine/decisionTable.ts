/**
 * decisionTable.ts - Weighted Scoring Verdict Engine
 *
 * Verdict is determined by a weighted score across 5 risk dimensions.
 * Confidence Signal = Negative is the only remaining hard override —
 * it fires unconditionally before scoring, because no weight should be
 * able to dilute a fundamental confidence failure.
 *
 * WEIGHTS (sum = 100):
 *   Workforce Intensity   30  — most direct driver of margin erosion
 *   Coordination Entropy  25  — compounding overhead across layers
 *   Commercial Exposure   20  — pricing and scope risk
 *   Volatility Control    15  — client-side unpredictability
 *   Measurement Maturity  10  — AI substitution risk
 *
 * SCORE THRESHOLDS (0–100):
 *   0–19   → Structurally Safe
 *   20–39  → Execution Heavy
 *   40–59  → Price Sensitive
 *   60–79  → Structurally Fragile
 *   80–100 → Do Not Proceed Without Repricing
 *
 * Accumulated medium risk example:
 *   All 5 dims at Medium → score 50 → Price Sensitive
 *   (Previously returned Structurally Safe — the bottleneck this fixes)
 */

import { Dimensions, Verdict, VerdictResult } from "./types";

const WEIGHTS = {
  workforceIntensity:  30,
  coordinationEntropy: 25,
  commercialExposure:  20,
  volatilityControl:   15,
  measurementMaturity: 10,
} as const;

function levelToFactor(level: "low" | "medium" | "high"): number {
  switch (level) {
    case "low":    return 0;
    case "medium": return 0.5;
    case "high":   return 1;
  }
}

function calculateWeightedScore(d: Dimensions): number {
  const raw =
    levelToFactor(d.workforceIntensity)  * WEIGHTS.workforceIntensity  +
    levelToFactor(d.coordinationEntropy) * WEIGHTS.coordinationEntropy +
    levelToFactor(d.commercialExposure)  * WEIGHTS.commercialExposure  +
    levelToFactor(d.volatilityControl)   * WEIGHTS.volatilityControl   +
    levelToFactor(d.measurementMaturity) * WEIGHTS.measurementMaturity;
  return Math.round(raw);
}

function scoreToVerdict(score: number): { verdict: Verdict; reason: string; triggeredBy: string[] } {
  if (score >= 80) {
    return {
      verdict: "Do Not Proceed Without Repricing",
      reason: "Critical multi-dimensional risk across weighted dimensions. Cumulative exposure exceeds safe operating thresholds. Engagement requires repricing or structural changes before commitment.",
      triggeredBy: ["WEIGHTED_SCORE_CRITICAL"],
    };
  }
  if (score >= 60) {
    return {
      verdict: "Structurally Fragile",
      reason: "Multiple high-weight risk dimensions are elevated simultaneously. Combined workforce intensity, coordination overhead, and commercial exposure create unsustainable margin pressure.",
      triggeredBy: ["WEIGHTED_SCORE_FRAGILE"],
    };
  }
  if (score >= 40) {
    return {
      verdict: "Price Sensitive",
      reason: "Accumulated risk across dimensions requires pricing protection. Scope elasticity, workforce demands, or coordination overhead will erode margin without active governance.",
      triggeredBy: ["WEIGHTED_SCORE_PRICE_SENSITIVE"],
    };
  }
  if (score >= 20) {
    return {
      verdict: "Execution Heavy",
      reason: "Elevated workforce intensity or coordination load will dominate delivery effort. Senior attention and iteration demands require active management.",
      triggeredBy: ["WEIGHTED_SCORE_EXECUTION_HEAVY"],
    };
  }
  return {
    verdict: "Structurally Safe",
    reason: "Weighted risk score within safe operating range. No material risk conditions triggered across any dimension. Proceed with standard governance.",
    triggeredBy: ["WEIGHTED_SCORE_SAFE"],
  };
}

export function decideVerdict(d: Dimensions): VerdictResult {
  // Hard override: Negative confidence is non-negotiable.
  // No weighted score can compensate for a fundamental confidence failure.
  if (d.confidenceSignal === "negative") {
    return {
      verdict: "Do Not Proceed Without Repricing",
      reason: "Pricing or delivery confidence is insufficient to proceed safely. Engagement requires repricing or structural changes before commitment. This overrides all other risk signals.",
      triggeredBy: ["LOW_CONFIDENCE_OVERRIDE"],
      weightedScore: null,
    };
  }

  const score = calculateWeightedScore(d);
  const { verdict, reason, triggeredBy } = scoreToVerdict(score);

  return { verdict, reason, triggeredBy, weightedScore: score };
}

export { WEIGHTS };
