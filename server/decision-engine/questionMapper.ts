/**
 * questionMapper.ts - Question to Signal Mapping Layer
 * 
 * Maps all 23 assessment questions to derived signals.
 * Q1-Q5 are identifiers and produce NO signals.
 * Each question maps to exactly one derived signal.
 */

import { Level, Confidence, Signals } from "./types";

export interface AssessmentInput {
  fullName: string;           // Q1 - Identifier
  workEmail: string;          // Q2 - Identifier
  roleTitle: string;          // Q3 - Identifier
  organisationName: string;   // Q4 - Identifier
  organisationSize: string;   // Q5 - Identifier
  decisionType: string;       // Q6 - Engagement Type → EngagementState
  specifyContext: string;     // Q7 - Context
  engagementClassification: string; // Q8 - Classification → EngagementState
  engagementType: string;     // Q9 - Pricing Model → PricingRigidity
  clientVolatility: string;   // Q10 - Client Volatility → ClientVolatility
  stakeholderComplexity: string; // Q11 - Stakeholder Complexity → StakeholderLoad
  seniorLeadershipInvolvement: string; // Q12 - Senior Involvement → SeniorDependency
  midLevelOversight: string;  // Q13 - Mid-level Coordination → CoordinationIntensity
  executionThinkingMix: string; // Q14 - Execution vs Thinking → IterationLoad proxy
  iterationIntensity: string; // Q15 - Iteration Intensity → IterationLoad
  scopeChangeLikelihood: string; // Q16 - Scope Volatility → ScopeElasticity
  crossFunctionalCoordination: string; // Q17 - Cross-Functional → CoordinationLoad
  aiImpactMeasurement: string; // Q18 - AI Leverage → AILeverage / MeasurementMaturity
  marginalValueSaturation: string; // Q19 - Value Saturation → GovernanceStrength proxy
  seniorOversightLoad: string; // Q20 - Senior Oversight Load → SeniorDependency modifier
  coordinationDecisionDrag: string; // Q21 - Coordination Drag → CoordinationLoad
  deliveryConfidence: string; // Q22 - Delivery Confidence → DeliveryConfidence
  openSignal?: string;        // Q23 - Open Signal → Narrative only
}

function mapToLevel(value: string, mapping: Record<string, Level>): Level {
  return mapping[value] ?? "medium";
}

function mapToConfidence(value: string, mapping: Record<string, Confidence>): Confidence {
  return mapping[value] ?? "neutral";
}

export function mapQuestionsToSignals(input: AssessmentInput): Signals {
  const clientVolatility = mapToLevel(input.clientVolatility, {
    "low": "low",
    "medium": "medium",
    "high": "high"
  });

  const stakeholderLoad = mapToLevel(input.stakeholderComplexity, {
    "low": "low",
    "medium": "medium",
    "high": "high"
  });

  const seniorFromInvolvement = mapToLevel(input.seniorLeadershipInvolvement, {
    "minimal": "low",
    "periodic": "medium",
    "frequent": "high",
    "continuous": "high"
  });

  const seniorFromLoad = mapToLevel(input.seniorOversightLoad, {
    "less": "low",
    "less_than_usual": "low",
    "about_same": "medium",
    "more": "high",
    "more_than_usual": "high"
  });

  const seniorDependency: Level =
    seniorFromInvolvement === "high" || seniorFromLoad === "high" ? "high" :
    seniorFromInvolvement === "medium" || seniorFromLoad === "medium" ? "medium" : "low";

  const coordFromMidLevel = mapToLevel(input.midLevelOversight, {
    "low": "low",
    "medium": "medium",
    "high": "high"
  });

  const coordFromCrossFunc = mapToLevel(input.crossFunctionalCoordination, {
    "low": "low",
    "medium": "medium",
    "high": "high"
  });

  const coordFromDrag = mapToLevel(input.coordinationDecisionDrag, {
    "minimal": "low",
    "moderate": "medium",
    "heavy": "high"
  });

  const coordinationLoad: Level =
    coordFromMidLevel === "high" || coordFromCrossFunc === "high" || coordFromDrag === "high" ? "high" :
    coordFromMidLevel === "medium" || coordFromCrossFunc === "medium" || coordFromDrag === "medium" ? "medium" : "low";

  const iterationLoad = mapToLevel(input.iterationIntensity, {
    "low": "low",
    "medium": "medium",
    "high": "high"
  });

  const scopeElasticity = mapToLevel(input.scopeChangeLikelihood, {
    "low": "low",
    "medium": "medium",
    "high": "high"
  });

  const pricingConfidence: Confidence =
    input.marginalValueSaturation === "significant" ? "positive" :
    input.marginalValueSaturation === "some" ? "neutral" :
    input.marginalValueSaturation === "minimal" || input.marginalValueSaturation === "none" ? "negative" : "neutral";

  const deliveryConfidence = mapToConfidence(input.deliveryConfidence, {
    "high": "positive",
    "some_concerns": "neutral",
    "low": "negative"
  });

  const measurementMaturity: Level =
    input.aiImpactMeasurement === "yes" ? "high" :
    input.aiImpactMeasurement === "no" ? "low" : "medium";

  const aiLeverage: Level =
    input.aiImpactMeasurement === "yes" ? "high" :
    input.aiImpactMeasurement === "not_applicable" ? "low" : "medium";

  const engagementState: Signals["engagementState"] =
    input.engagementClassification === "new" ? "new" :
    input.engagementClassification === "ongoing-less-6" || 
    input.engagementClassification === "ongoing-6-12" || 
    input.engagementClassification === "ongoing-12-plus" ? "ongoing" :
    input.engagementClassification === "renewal-expansion" ? "renewal" :
    input.decisionType === "escalation" ? "escalation" :
    input.decisionType === "strategic-exception" ? "strategic" : "new";

  const pricingRigidity: Level =
    (input.engagementType === "commission" || input.engagementType === "outcome-based") ? "high" :
    (input.engagementType === "hybrid" || input.engagementType === "hybrid-retainer-commission" || input.engagementType === "hybrid-retainer-outcome") ? "medium" : "low";

  const executionMix = input.executionThinkingMix;
  const teamMaturity: Level =
    executionMix === "execution-heavy" ? "high" :
    executionMix === "balanced" ? "medium" : "low";

  const resourcingFlex: Level =
    pricingRigidity === "high" ? "low" :
    pricingRigidity === "low" ? "high" : "medium";

  const governanceStrength: Level =
    input.marginalValueSaturation === "significant" ? "high" :
    input.marginalValueSaturation === "some" ? "medium" : "low";

  return {
    clientVolatility,
    stakeholderLoad,
    seniorDependency,
    coordinationLoad,
    iterationLoad,
    scopeElasticity,
    pricingConfidence,
    deliveryConfidence,
    measurementMaturity,
    aiLeverage,
    engagementState,
    pricingRigidity,
    teamMaturity,
    resourcingFlex,
    governanceStrength
  };
}

export interface IdentifierFields {
  fullName: string;
  workEmail: string;
  roleTitle: string;
  organisationName: string;
  organisationSize: string;
  specifyContext: string;
  decisionType: string;
  openSignal?: string;
}

export function extractIdentifiers(input: AssessmentInput): IdentifierFields {
  return {
    fullName: input.fullName,
    workEmail: input.workEmail,
    roleTitle: input.roleTitle,
    organisationName: input.organisationName,
    organisationSize: input.organisationSize,
    specifyContext: input.specifyContext,
    decisionType: input.decisionType,
    openSignal: input.openSignal
  };
}
