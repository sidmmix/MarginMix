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
  industry?: string;          // Q6 - Identifier (Marketing/ITeS/MC/Software)
  decisionType: string;       // Q7 - Engagement Type → EngagementState
  specifyContext: string;     // Q8 - Context
  engagementClassification: string; // Q9 - Classification → EngagementState
  engagementType: string;     // Q10 - Pricing Model → PricingRigidity
  deliveryModel?: string;     // Q10b - Identifier (ITeS/Software only)
  clientVolatility: string;   // Q11 - Client Volatility → ClientVolatility
  stakeholderComplexity: string; // Q12 - Stakeholder Complexity → StakeholderLoad
  seniorLeadershipInvolvement: string; // Q13 - Senior Involvement → SeniorDependency
  midLevelOversight: string;  // Q14 - Mid-level Coordination → CoordinationIntensity
  executionThinkingMix: string; // Q15 - Execution vs Thinking → IterationLoad proxy
  iterationIntensity: string; // Q16 - Iteration Intensity → IterationLoad
  scopeChangeLikelihood: string; // Q17 - Scope Volatility → ScopeElasticity
  crossFunctionalCoordination: string; // Q18 - Cross-Functional → CoordinationLoad
  aiEffortShift: string; // Q19 - AI Effort Shift → AILeverage / MeasurementMaturity
  marginalValueSaturation: string; // Q20 - Value Saturation → GovernanceStrength proxy
  seniorOversightLoad: string; // Q21 - Senior Oversight Load → SeniorDependency modifier
  coordinationDecisionDrag: string; // Q22 - Coordination Drag → CoordinationLoad
  deliveryConfidence: string; // Q23 - Delivery Confidence → DeliveryConfidence
  aiAgenticFramework?: string;          // Q24 - Agentic framework usage → MeasurementMaturity modifier
  aiHumanHoursReplaced?: string;        // Q25 - AI hours replaced → MeasurementMaturity modifier
  aiCommercialImpactMeasured?: string;  // Q26 - AI commercial impact → MeasurementMaturity modifier
  openSignal?: string;        // Q27 - Open Signal → Narrative only
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

  const baseMaturity: Level =
    input.aiEffortShift === "junior_execution" ? "high" :
    input.aiEffortShift === "mid_level_production" ? "medium" :
    input.aiEffortShift === "senior_thinking_review" ? "low" :
    "low";

  const aiHoursRisk: Level =
    input.aiHumanHoursReplaced === "75-100" ? "high" :
    input.aiHumanHoursReplaced === "50-75" ? "high" :
    input.aiHumanHoursReplaced === "25-50" ? "medium" :
    "low";

  const aiImpactRisk: Level = input.aiCommercialImpactMeasured === "no" ? "high" : "low";
  const aiAgenticRisk: Level = input.aiAgenticFramework === "yes" ? "high" : "low";

  const aiRiskPeak: Level =
    aiHoursRisk === "high" || aiImpactRisk === "high" || aiAgenticRisk === "high" ? "high" :
    aiHoursRisk === "medium" || aiImpactRisk === "medium" || aiAgenticRisk === "medium" ? "medium" :
    "low";

  const measurementMaturity: Level =
    baseMaturity === "high" || aiRiskPeak === "high" ? "high" :
    baseMaturity === "medium" || aiRiskPeak === "medium" ? "medium" :
    "low";

  const aiLeverage: Level =
    input.aiEffortShift === "junior_execution" ? "high" :
    input.aiEffortShift === "mid_level_production" ? "medium" :
    input.aiEffortShift === "senior_thinking_review" ? "low" :
    "low";

  const engagementState: Signals["engagementState"] =
    input.engagementClassification === "new" ? "new" :
    input.engagementClassification === "ongoing-less-6" || 
    input.engagementClassification === "ongoing-6-12" || 
    input.engagementClassification === "ongoing-12-plus" ? "ongoing" :
    input.engagementClassification === "renewal-expansion" ? "renewal" :
    input.decisionType === "escalation" ? "escalation" :
    input.decisionType === "strategic-exception" ? "strategic" : "new";

  const HIGH_RIGIDITY = new Set([
    "commission", "outcome-based",
    "ites-fixed-price", "ites-outcome",
    "mc-fixed-fee", "mc-outcome",
    "sw-fixed-price", "sw-outcome", "sw-implementation"
  ]);
  const MEDIUM_RIGIDITY = new Set([
    "hybrid", "hybrid-retainer-commission", "hybrid-retainer-outcome",
    "ites-tm", "ites-managed-services", "ites-hybrid",
    "mc-tm", "mc-hybrid",
    "sw-managed-services", "sw-saas-services", "sw-tm"
  ]);
  const pricingRigidity: Level =
    HIGH_RIGIDITY.has(input.engagementType) ? "high" :
    MEDIUM_RIGIDITY.has(input.engagementType) ? "medium" : "low";

  const executionMix = input.executionThinkingMix;
  const teamMaturity: Level =
    executionMix === "execution-heavy" ? "high" :
    executionMix === "balanced" ? "medium" :
    executionMix === "technical-implementation" ? "medium" :
    executionMix === "thinking-heavy" || executionMix === "advisory-solutioning" || executionMix === "strategy-advisory" ? "low" :
    "low";

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
