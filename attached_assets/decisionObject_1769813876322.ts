
// decisionObject.ts
// Canonical, immutable decision object schema

export interface DecisionObject {
  verdict: string;
  riskType: "Structural" | "Behavioral" | "Commercial" | "Mixed";
  effortBand: string;
  effortPercentages: {
    senior: string;
    mid: string;
    junior: string;
  };
  bucketScores: {
    WI: number;
    SI: number;
    CO: number;
    VSI: number;
    CE: number;
  };
  dominantDrivers: string[];
  correctability: string;
  createdAt: string;
}

export function buildDecisionObject(params): DecisionObject {
  return {
    verdict: params.verdict,
    riskType: params.riskType,
    effortBand: params.effortBand,
    effortPercentages: params.effortPercentages,
    bucketScores: params.bucketScores,
    dominantDrivers: params.dominantDrivers,
    correctability: params.correctability,
    createdAt: new Date().toISOString()
  };
}
