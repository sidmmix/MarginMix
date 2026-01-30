/**
 * decisionObject.ts - Canonical Immutable Decision Object
 * 
 * This is the system-of-record object that captures all computed
 * decision outputs. It is immutable once created and serves as
 * the single source of truth for rendering outputs.
 */

import { BucketScores } from "./buckets";
import { SaturationFlags, AIImpactClassification, RiskSource, Correctability } from "./rules";
import { MarginVerdict, RiskBand } from "./verdict";

export interface EngagementContext {
  type: string;
  classification: string;
  multiplier: number;
  organisationName: string;
  organisationSize: string;
  roleTitle: string;
  fullName: string;
  workEmail: string;
}

export interface DecisionObject {
  readonly id: string;
  readonly engagementContext: EngagementContext;
  readonly marginRiskVerdict: MarginVerdict;
  readonly riskBand: RiskBand;
  readonly bucketScores: BucketScores;
  readonly bucketBands: {
    WI: string;
    SI: string;
    CO: string;
    VSI: string;
    CE: string;
  };
  readonly valueSaturationFlag: boolean;
  readonly saturationDetails: SaturationFlags;
  readonly aiImpactClassification: AIImpactClassification;
  readonly riskSource: RiskSource;
  readonly dominantDrivers: string[];
  readonly correctability: Correctability;
  readonly effortBand: string;
  readonly effortPercentages: {
    senior: string;
    mid: string;
    junior: string;
  };
  readonly compositeRiskScore: number;
  readonly createdAt: string;
}

export interface BuildDecisionObjectParams {
  engagementContext: EngagementContext;
  marginRiskVerdict: MarginVerdict;
  riskBand: RiskBand;
  bucketScores: BucketScores;
  bucketBands: {
    WI: string;
    SI: string;
    CO: string;
    VSI: string;
    CE: string;
  };
  saturationFlags: SaturationFlags;
  aiImpactClassification: AIImpactClassification;
  riskSource: RiskSource;
  dominantDrivers: string[];
  correctability: Correctability;
  effortBand: string;
  effortPercentages: {
    senior: string;
    mid: string;
    junior: string;
  };
}

function generateDecisionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `DEC-${timestamp}-${random}`.toUpperCase();
}

function computeCompositeScore(buckets: BucketScores): number {
  const weights = { WI: 0.30, SI: 0.25, CO: 0.25, VSI: 0.20 };
  const score = (
    buckets.WI * weights.WI +
    buckets.SI * weights.SI +
    buckets.CO * weights.CO +
    buckets.VSI * weights.VSI
  );
  return Math.round(score * 10) / 10;
}

export function buildDecisionObject(params: BuildDecisionObjectParams): DecisionObject {
  const decisionObject: DecisionObject = Object.freeze({
    id: generateDecisionId(),
    engagementContext: Object.freeze({ ...params.engagementContext }),
    marginRiskVerdict: params.marginRiskVerdict,
    riskBand: params.riskBand,
    bucketScores: Object.freeze({ ...params.bucketScores }),
    bucketBands: Object.freeze({ ...params.bucketBands }),
    valueSaturationFlag: params.saturationFlags.valueSaturationPresent,
    saturationDetails: Object.freeze({ ...params.saturationFlags }),
    aiImpactClassification: params.aiImpactClassification,
    riskSource: params.riskSource,
    dominantDrivers: Object.freeze([...params.dominantDrivers]) as readonly string[],
    correctability: params.correctability,
    effortBand: params.effortBand,
    effortPercentages: Object.freeze({ ...params.effortPercentages }),
    compositeRiskScore: computeCompositeScore(params.bucketScores),
    createdAt: new Date().toISOString()
  });
  
  return decisionObject;
}

export function serializeDecisionObject(decision: DecisionObject): string {
  return JSON.stringify(decision, null, 2);
}

export function parseDecisionObject(json: string): DecisionObject {
  const parsed = JSON.parse(json);
  return Object.freeze(parsed) as DecisionObject;
}
