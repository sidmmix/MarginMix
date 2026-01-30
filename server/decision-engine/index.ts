/**
 * Decision Engine - Main Orchestrator
 * 
 * This module ties together all decision engine layers to produce
 * the canonical decision object from raw assessment input.
 * 
 * Flow:
 * 1. Normalize inputs (scoring.ts)
 * 2. Compute bucket scores (buckets.ts)
 * 3. Apply context multipliers (rules.ts)
 * 4. Detect saturation patterns (rules.ts)
 * 5. Classify AI impact (rules.ts)
 * 6. Determine verdict (verdict.ts)
 * 7. Build immutable decision object (decisionObject.ts)
 */

import { RawAssessmentInput, normalizeScores, getEngagementContext } from "./scoring";
import { computeBuckets, getBucketBand, BucketScores } from "./buckets";
import { 
  applyContextMultipliers, 
  detectSaturationPatterns, 
  classifyAIImpact,
  attributeRiskSource,
  determineCorrectability,
  getContextMultiplierValue
} from "./rules";
import { classifyVerdict } from "./verdict";
import { buildDecisionObject, DecisionObject, EngagementContext } from "./decisionObject";

export interface AssessmentInput {
  fullName: string;
  workEmail: string;
  roleTitle: string;
  organisationName: string;
  organisationSize: string;
  engagementType: string;
  engagementClassification: string;
  clientVolatility: string;
  stakeholderComplexity: string;
  seniorLeadershipInvolvement: string;
  midLevelOversight: string;
  executionThinkingMix: string;
  iterationIntensity: string;
  scopeChangeLikelihood: string;
  crossFunctionalCoordination: string;
  aiImpactMeasurement: string;
  marginalValueSaturation: string;
  seniorOversightLoad: string;
  coordinationDecisionDrag: string;
  deliveryConfidence: string;
}

export function executeDecisionEngine(input: AssessmentInput): DecisionObject {
  const rawInput: RawAssessmentInput = {
    engagementClassification: input.engagementClassification,
    clientVolatility: input.clientVolatility,
    stakeholderComplexity: input.stakeholderComplexity,
    seniorLeadershipInvolvement: input.seniorLeadershipInvolvement,
    midLevelOversight: input.midLevelOversight,
    executionThinkingMix: input.executionThinkingMix,
    iterationIntensity: input.iterationIntensity,
    scopeChangeLikelihood: input.scopeChangeLikelihood,
    crossFunctionalCoordination: input.crossFunctionalCoordination,
    aiImpactMeasurement: input.aiImpactMeasurement,
    marginalValueSaturation: input.marginalValueSaturation,
    seniorOversightLoad: input.seniorOversightLoad,
    coordinationDecisionDrag: input.coordinationDecisionDrag,
    deliveryConfidence: input.deliveryConfidence
  };

  const normalizedScores = normalizeScores(rawInput);

  const rawBuckets = computeBuckets(normalizedScores);

  const engagementContext = getEngagementContext(input.engagementClassification);
  const adjustedBuckets = applyContextMultipliers(rawBuckets, engagementContext);

  const saturationFlags = detectSaturationPatterns(adjustedBuckets);

  const aiImpact = classifyAIImpact(normalizedScores, adjustedBuckets);

  const verdictResult = classifyVerdict(adjustedBuckets, saturationFlags, aiImpact);

  const riskSource = attributeRiskSource(adjustedBuckets, saturationFlags, aiImpact);
  const correctability = determineCorrectability(adjustedBuckets, saturationFlags, riskSource);

  const bucketBands = {
    WI: getBucketBand(adjustedBuckets.WI),
    SI: getBucketBand(adjustedBuckets.SI),
    CO: getBucketBand(adjustedBuckets.CO),
    VSI: getBucketBand(adjustedBuckets.VSI),
    CE: getBucketBand(adjustedBuckets.CE)
  };

  const engagementContextObj: EngagementContext = {
    type: input.engagementType,
    classification: input.engagementClassification,
    multiplier: getContextMultiplierValue(engagementContext),
    organisationName: input.organisationName,
    organisationSize: input.organisationSize,
    roleTitle: input.roleTitle,
    fullName: input.fullName,
    workEmail: input.workEmail
  };

  const decisionObject = buildDecisionObject({
    engagementContext: engagementContextObj,
    marginRiskVerdict: verdictResult.verdict,
    riskBand: verdictResult.riskBand,
    bucketScores: adjustedBuckets,
    bucketBands,
    saturationFlags,
    aiImpactClassification: aiImpact,
    riskSource,
    dominantDrivers: verdictResult.dominantDrivers,
    correctability,
    effortBand: verdictResult.effortBand,
    effortPercentages: verdictResult.effortPercentages
  });

  return decisionObject;
}

export type { DecisionObject } from "./decisionObject";
export type { BucketScores } from "./buckets";
