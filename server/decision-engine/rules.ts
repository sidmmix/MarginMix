/**
 * rules.ts - Context Multipliers & Saturation Detection Layer
 * 
 * Applies engagement context multipliers and detects:
 * - Value saturation patterns
 * - AI impact classification
 * - Risk source attribution
 */

import { BucketScores } from "./buckets";
import { NormalizedScores } from "./scoring";

export interface ContextMultipliers {
  new_pitch: number;
  renewal: number;
  scope_expansion: number;
  delivery_escalation: number;
  strategic_high_visibility: number;
}

export interface SaturationFlags {
  valueSaturationPresent: boolean;
  opticsDrivenStaffing: boolean;
  upwardCostShift: boolean;
}

export type AIImpactClassification = "Accretive" | "Neutral" | "Fragile" | "Dilutive";

export type RiskSource = "Structural" | "Behavioral" | "Technology-Amplified" | "Mixed";

export type Correctability = "Correctable" | "Correctable with Redesign" | "Not Correctable";

const CONTEXT_MULTIPLIERS: ContextMultipliers = {
  new_pitch: 1.0,
  renewal: 1.15,
  scope_expansion: 1.2,
  delivery_escalation: 1.3,
  strategic_high_visibility: 1.25
};

function clamp(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function applyContextMultipliers(
  buckets: BucketScores,
  engagementContext: string
): BucketScores {
  const multiplier = CONTEXT_MULTIPLIERS[engagementContext as keyof ContextMultipliers] ?? 1.0;
  
  return {
    WI: clamp(Math.round(buckets.WI * multiplier * 10) / 10),
    SI: clamp(Math.round(buckets.SI * multiplier * 10) / 10),
    CO: clamp(Math.round(buckets.CO * multiplier * 10) / 10),
    VSI: clamp(Math.round(buckets.VSI * multiplier * 10) / 10),
    CE: buckets.CE
  };
}

export function detectSaturationPatterns(buckets: BucketScores): SaturationFlags {
  const HIGH_THRESHOLD = 65;
  const LOW_THRESHOLD = 35;
  
  return {
    valueSaturationPresent: buckets.WI > HIGH_THRESHOLD && buckets.VSI > HIGH_THRESHOLD,
    opticsDrivenStaffing: buckets.CO > HIGH_THRESHOLD && buckets.VSI > HIGH_THRESHOLD,
    upwardCostShift: buckets.SI > HIGH_THRESHOLD && buckets.VSI > HIGH_THRESHOLD
  };
}

export function classifyAIImpact(scores: NormalizedScores, buckets: BucketScores): AIImpactClassification {
  const aiScore = scores.aiEffortShift;
  
  if (aiScore <= 30) return "Accretive";
  
  if (aiScore >= 70) return "Dilutive";
  
  return "Neutral";
}

export function attributeRiskSource(
  buckets: BucketScores,
  saturationFlags: SaturationFlags,
  aiImpact: AIImpactClassification
): RiskSource {
  const sources: string[] = [];
  
  if (buckets.WI > 60 || buckets.SI > 60) {
    sources.push("Structural");
  }
  
  if (buckets.CO > 60) {
    sources.push("Behavioral");
  }
  
  if (aiImpact === "Dilutive" || aiImpact === "Fragile" || saturationFlags.upwardCostShift) {
    sources.push("Technology-Amplified");
  }
  
  if (sources.length === 0) return "Structural";
  if (sources.length === 1) return sources[0] as RiskSource;
  return "Mixed";
}

export function determineCorrectability(
  buckets: BucketScores,
  saturationFlags: SaturationFlags,
  riskSource: RiskSource
): Correctability {
  const avgRiskScore = (buckets.WI + buckets.SI + buckets.CO) / 3;
  
  if (avgRiskScore <= 40 && !saturationFlags.valueSaturationPresent) {
    return "Correctable";
  }
  
  if (avgRiskScore <= 65 || riskSource === "Behavioral") {
    return "Correctable with Redesign";
  }
  
  if (saturationFlags.valueSaturationPresent && saturationFlags.upwardCostShift) {
    return "Not Correctable";
  }
  
  return "Correctable with Redesign";
}

export function getContextMultiplierValue(engagementContext: string): number {
  return CONTEXT_MULTIPLIERS[engagementContext as keyof ContextMultipliers] ?? 1.0;
}
