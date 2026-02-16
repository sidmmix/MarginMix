/**
 * marginImpactCalculator.ts - Deterministic Margin Impact Calculator
 * 
 * Maps verdict + risk dimensions to an estimated margin impact percentage.
 * This is purely rule-based — NO AI, NO ML.
 * 
 * The calculator uses:
 * 1. Verdict → base impact range
 * 2. Dimension levels → fine-tune within range
 * 3. User's current margin % → compute effective margin
 */

import { Verdict, Dimensions, Level, Confidence } from "./types";

export interface MarginImpact {
  currentMargin: number;
  estimatedLoss: number;
  effectiveMargin: number;
  impactLabel: "No Impact" | "Minimal Impact" | "Moderate Impact" | "Significant Impact" | "Severe Impact";
  impactColor: "emerald" | "amber" | "red";
}

interface VerdictImpactRange {
  min: number;
  max: number;
}

const verdictImpactRanges: Record<Verdict, VerdictImpactRange> = {
  "Structurally Safe": { min: 0, max: 3 },
  "Execution Heavy": { min: 3, max: 8 },
  "Price Sensitive": { min: 5, max: 12 },
  "Structurally Fragile": { min: 10, max: 18 },
  "Do Not Proceed Without Repricing": { min: 15, max: 25 },
};

function levelToWeight(level: Level): number {
  switch (level) {
    case "low": return 0;
    case "medium": return 0.5;
    case "high": return 1;
    default: return 0.5;
  }
}

function confidenceToWeight(confidence: Confidence): number {
  switch (confidence) {
    case "positive": return 0;
    case "neutral": return 0.5;
    case "negative": return 1;
    default: return 0.5;
  }
}

export function calculateMarginImpact(
  currentMargin: number,
  verdict: Verdict,
  dimensions: Dimensions
): MarginImpact {
  const range = verdictImpactRanges[verdict] || verdictImpactRanges["Structurally Safe"];

  const dimensionWeights = [
    levelToWeight(dimensions.workforceIntensity),
    levelToWeight(dimensions.coordinationEntropy),
    levelToWeight(dimensions.commercialExposure),
    levelToWeight(dimensions.volatilityControl),
    confidenceToWeight(dimensions.confidenceSignal),
    levelToWeight(dimensions.measurementMaturity),
  ];

  const avgWeight = dimensionWeights.reduce((a, b) => a + b, 0) / dimensionWeights.length;

  const estimatedLoss = Math.round((range.min + (range.max - range.min) * avgWeight) * 10) / 10;

  const effectiveMargin = Math.round((currentMargin - estimatedLoss) * 10) / 10;

  let impactLabel: MarginImpact["impactLabel"];
  let impactColor: MarginImpact["impactColor"];

  if (estimatedLoss <= 1) {
    impactLabel = "No Impact";
    impactColor = "emerald";
  } else if (estimatedLoss <= 4) {
    impactLabel = "Minimal Impact";
    impactColor = "emerald";
  } else if (estimatedLoss <= 8) {
    impactLabel = "Moderate Impact";
    impactColor = "amber";
  } else if (estimatedLoss <= 15) {
    impactLabel = "Significant Impact";
    impactColor = "red";
  } else {
    impactLabel = "Severe Impact";
    impactColor = "red";
  }

  return {
    currentMargin,
    estimatedLoss,
    effectiveMargin: Math.max(effectiveMargin, 0),
    impactLabel,
    impactColor,
  };
}
