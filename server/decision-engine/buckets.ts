/**
 * buckets.ts - Bucket Score Computation Layer
 * 
 * Computes the five core buckets from normalized scores:
 * - WI: Workforce Intensity
 * - SI: Senior Involvement  
 * - CO: Coordination Overhead
 * - VSI: Value Saturation Index
 * - CE: Commercial Elasticity
 */

import { NormalizedScores } from "./scoring";

export interface BucketScores {
  WI: number;   // Workforce Intensity (0-100)
  SI: number;   // Senior Involvement (0-100)
  CO: number;   // Coordination Overhead (0-100)
  VSI: number;  // Value Saturation Index (0-100)
  CE: number;   // Commercial Elasticity (0-100)
}

export interface BucketWeights {
  WI: { clientVolatility: number; iterationIntensity: number; scopeChangeLikelihood: number; executionThinkingMix: number };
  SI: { seniorLeadershipInvolvement: number; midLevelOversight: number; seniorOversightLoad: number };
  CO: { stakeholderComplexity: number; crossFunctionalCoordination: number; coordinationDecisionDrag: number };
  VSI: { marginalValueSaturation: number };
  CE: { deliveryConfidence: number };
}

const BUCKET_WEIGHTS: BucketWeights = {
  WI: {
    clientVolatility: 0.30,
    iterationIntensity: 0.30,
    scopeChangeLikelihood: 0.25,
    executionThinkingMix: 0.15
  },
  SI: {
    seniorLeadershipInvolvement: 0.45,
    midLevelOversight: 0.25,
    seniorOversightLoad: 0.30
  },
  CO: {
    stakeholderComplexity: 0.35,
    crossFunctionalCoordination: 0.35,
    coordinationDecisionDrag: 0.30
  },
  VSI: {
    marginalValueSaturation: 1.0
  },
  CE: {
    deliveryConfidence: 1.0
  }
};

function clamp(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value));
}

function weightedAverage(values: number[], weights: number[]): number {
  if (values.length !== weights.length || values.length === 0) return 50;
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0);
  
  return clamp(weightedSum / totalWeight);
}

export function computeBuckets(scores: NormalizedScores): BucketScores {
  const WI = weightedAverage(
    [
      scores.clientVolatility,
      scores.iterationIntensity,
      scores.scopeChangeLikelihood,
      scores.executionThinkingMix
    ],
    [
      BUCKET_WEIGHTS.WI.clientVolatility,
      BUCKET_WEIGHTS.WI.iterationIntensity,
      BUCKET_WEIGHTS.WI.scopeChangeLikelihood,
      BUCKET_WEIGHTS.WI.executionThinkingMix
    ]
  );

  const SI = weightedAverage(
    [
      scores.seniorLeadershipInvolvement,
      scores.midLevelOversight,
      scores.seniorOversightLoad
    ],
    [
      BUCKET_WEIGHTS.SI.seniorLeadershipInvolvement,
      BUCKET_WEIGHTS.SI.midLevelOversight,
      BUCKET_WEIGHTS.SI.seniorOversightLoad
    ]
  );

  const CO = weightedAverage(
    [
      scores.stakeholderComplexity,
      scores.crossFunctionalCoordination,
      scores.coordinationDecisionDrag
    ],
    [
      BUCKET_WEIGHTS.CO.stakeholderComplexity,
      BUCKET_WEIGHTS.CO.crossFunctionalCoordination,
      BUCKET_WEIGHTS.CO.coordinationDecisionDrag
    ]
  );

  const VSI = scores.marginalValueSaturation;

  const CE = 100 - scores.deliveryConfidence;

  return {
    WI: Math.round(WI * 10) / 10,
    SI: Math.round(SI * 10) / 10,
    CO: Math.round(CO * 10) / 10,
    VSI: Math.round(VSI * 10) / 10,
    CE: Math.round(CE * 10) / 10
  };
}

export function getBucketBand(score: number): "Low" | "Moderate" | "High" | "Very High" {
  if (score <= 30) return "Low";
  if (score <= 50) return "Moderate";
  if (score <= 70) return "High";
  return "Very High";
}
