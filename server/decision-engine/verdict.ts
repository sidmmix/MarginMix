/**
 * verdict.ts - Margin Risk Classification Layer
 * 
 * Classifies the overall margin risk verdict based on bucket scores,
 * saturation flags, and engagement context.
 */

import { BucketScores, getBucketBand } from "./buckets";
import { SaturationFlags, AIImpactClassification } from "./rules";

export type MarginVerdict = 
  | "Structurally Viable"
  | "Conditionally Viable"
  | "Structurally Fragile"
  | "Economically Non-Viable";

export type RiskBand = "Low" | "Moderate" | "High" | "Very High";

export interface VerdictResult {
  verdict: MarginVerdict;
  riskBand: RiskBand;
  dominantDrivers: string[];
  effortBand: string;
  effortPercentages: {
    senior: string;
    mid: string;
    junior: string;
  };
}

function computeCompositeRiskScore(buckets: BucketScores): number {
  const weights = {
    WI: 0.30,
    SI: 0.25,
    CO: 0.25,
    VSI: 0.20
  };
  
  return (
    buckets.WI * weights.WI +
    buckets.SI * weights.SI +
    buckets.CO * weights.CO +
    buckets.VSI * weights.VSI
  );
}

function determineRiskBand(compositeScore: number): RiskBand {
  if (compositeScore <= 30) return "Low";
  if (compositeScore <= 50) return "Moderate";
  if (compositeScore <= 70) return "High";
  return "Very High";
}

function identifyDominantDrivers(buckets: BucketScores): string[] {
  const drivers: { name: string; score: number; label: string }[] = [
    { name: "WI", score: buckets.WI, label: "Workforce Intensity" },
    { name: "SI", score: buckets.SI, label: "Senior Involvement" },
    { name: "CO", score: buckets.CO, label: "Coordination Overhead" },
    { name: "VSI", score: buckets.VSI, label: "Value Saturation" }
  ];
  
  drivers.sort((a, b) => b.score - a.score);
  
  const dominant: string[] = [];
  const threshold = 50;
  
  for (const driver of drivers) {
    if (driver.score >= threshold && dominant.length < 3) {
      dominant.push(driver.label);
    }
  }
  
  if (dominant.length === 0) {
    dominant.push(drivers[0].label);
  }
  
  return dominant;
}

function computeEffortDistribution(buckets: BucketScores): { senior: string; mid: string; junior: string } {
  let seniorBase = 15;
  let midBase = 35;
  let juniorBase = 50;
  
  if (buckets.SI > 70) {
    seniorBase += 20;
    midBase -= 10;
    juniorBase -= 10;
  } else if (buckets.SI > 50) {
    seniorBase += 10;
    midBase -= 5;
    juniorBase -= 5;
  }
  
  if (buckets.WI > 70) {
    midBase += 10;
    juniorBase += 5;
    seniorBase -= 5;
  }
  
  if (buckets.CO > 60) {
    seniorBase += 5;
    midBase += 5;
    juniorBase -= 10;
  }
  
  const total = seniorBase + midBase + juniorBase;
  const senior = Math.round((seniorBase / total) * 100);
  const mid = Math.round((midBase / total) * 100);
  const junior = 100 - senior - mid;
  
  return {
    senior: `${senior}%`,
    mid: `${mid}%`,
    junior: `${junior}%`
  };
}

function determineEffortBand(buckets: BucketScores): string {
  const avgIntensity = (buckets.WI + buckets.SI + buckets.CO) / 3;
  
  if (avgIntensity <= 30) return "Low Effort";
  if (avgIntensity <= 50) return "Moderate Effort";
  if (avgIntensity <= 70) return "High Effort";
  return "Very High Effort";
}

export function classifyVerdict(
  buckets: BucketScores,
  saturationFlags: SaturationFlags,
  aiImpact: AIImpactClassification
): VerdictResult {
  const compositeScore = computeCompositeRiskScore(buckets);
  const riskBand = determineRiskBand(compositeScore);
  const dominantDrivers = identifyDominantDrivers(buckets);
  const effortBand = determineEffortBand(buckets);
  const effortPercentages = computeEffortDistribution(buckets);
  
  let verdict: MarginVerdict;
  
  if (saturationFlags.valueSaturationPresent && saturationFlags.upwardCostShift) {
    verdict = "Economically Non-Viable";
  } else if (compositeScore <= 35 && !saturationFlags.valueSaturationPresent) {
    verdict = "Structurally Viable";
  } else if (compositeScore <= 55) {
    verdict = "Conditionally Viable";
  } else if (compositeScore <= 75 || saturationFlags.valueSaturationPresent) {
    verdict = "Structurally Fragile";
  } else {
    verdict = "Economically Non-Viable";
  }
  
  if (aiImpact === "Dilutive" && verdict === "Conditionally Viable") {
    verdict = "Structurally Fragile";
  }
  
  return {
    verdict,
    riskBand,
    dominantDrivers,
    effortBand,
    effortPercentages
  };
}
