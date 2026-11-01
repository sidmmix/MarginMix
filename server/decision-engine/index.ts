/**
 * Decision Engine - Main Entry Point
 * 
 * This module integrates the new deterministic decision engine
 * with the existing PDF and narrative generation systems.
 * 
 * Flow:
 * 1. Map questions to signals (questionMapper)
 * 2. Map signals to dimensions (dimensionMapper)
 * 3. Decide verdict using decision table (decisionTable)
 * 4. Detect contradictions (contradictionDetector)
 * 5. Build the canonical decision object and computation trace for rendering
 * 
 * AI is NOT used in this engine. AI may only be used externally
 * to narrate the already-computed outputs.
 */

import { runMarginMix, AssessmentInput as EngineAssessmentInput } from "./engine";
import { Verdict, Level, ContradictionFlag, Dimensions, Signals } from "./types";
import type { ComputationTrace } from "./scorecard";

export interface AssessmentInput {
  fullName: string;
  workEmail: string;
  roleTitle: string;
  organisationName: string;
  organisationSize: string;
  industry?: string;
  deliveryModel?: string;
  decisionType: string;
  specifyContext: string;
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
  aiEffortShift: string;
  marginalValueSaturation: string;
  seniorOversightLoad: string;
  coordinationDecisionDrag: string;
  deliveryConfidence?: string;
  aiHumanHoursReplaced?: string;
  aiCommercialImpactMeasured?: string;
  aiAgenticFramework?: string;
  openSignal?: string;
  currentMargin?: number;
}

export type MarginVerdict = Verdict;
export type RiskBand = "Low" | "Moderate" | "High" | "Very High";

export interface EngagementContext {
  type: string;
  classification: string;
  organisationName: string;
  organisationSize: string;
  roleTitle: string;
  fullName: string;
  workEmail: string;
  specifyContext: string;
  decisionType: string;
}

export interface BucketScores {
  WI: number;
  CO: number;
  CE: number;
  VC: number;
  MM: number;
}

export interface SaturationFlags {
  valueSaturationPresent: boolean;
  upwardCostShift: boolean;
}

export type AIImpactClassification = "Accretive" | "Neutral" | "Fragile" | "Dilutive";

export interface DecisionObject {
  readonly id: string;
  readonly engagementContext: EngagementContext;
  readonly marginRiskVerdict: MarginVerdict;
  readonly riskBand: RiskBand;
  readonly dimensions: Dimensions;
  readonly signals: Signals;
  readonly bucketScores: BucketScores;
  readonly bucketBands: {
    WI: string;
    CO: string;
    CE: string;
    VC: string;
    MM: string;
  };
  readonly valueSaturationFlag: boolean;
  readonly saturationDetails: SaturationFlags;
  readonly aiImpactClassification: AIImpactClassification;
  readonly aiEffortShiftLabel: string;
  readonly dominantDrivers: readonly string[];
  readonly contradictionFlags: readonly ContradictionFlag[];
  readonly verdictReason: string;
  readonly triggeredBy: readonly string[];
  readonly compositeRiskScore: number;
  readonly createdAt: string;
  readonly computationTrace: ComputationTrace;
}

function generateDecisionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `DEC-${timestamp}-${random}`.toUpperCase();
}

function levelToBand(level: Level): string {
  switch (level) {
    case "low": return "Low";
    case "medium": return "Moderate";
    case "high": return "High";
    default: return "Moderate";
  }
}

function verdictToRiskBand(verdict: Verdict): RiskBand {
  switch (verdict) {
    case "Structurally Safe": return "Low";
    case "Execution Heavy": return "Moderate";
    case "Price Sensitive": return "Moderate";
    case "Structurally Fragile": return "High";
    case "Do Not Proceed Without Repricing": return "Very High";
    default: return "Moderate";
  }
}

function getAIEffortShiftLabel(value: string): string {
  const labels: Record<string, string> = {
    "junior_execution": "Junior execution",
    "mid_level_production": "Mid-level production",
    "senior_thinking_review": "Senior thinking / review",
    "no_clear_substitution": "No clear substitution"
  };
  return labels[value] || "Not specified";
}

function computeAIImpact(signals: Signals): AIImpactClassification {
  if (signals.aiLeverage === "high" && signals.measurementMaturity === "low") {
    return "Accretive";
  }
  if (signals.aiLeverage === "medium") {
    return "Neutral";
  }
  if (signals.aiLeverage === "low" && signals.measurementMaturity === "high") {
    return "Dilutive";
  }
  return "Dilutive";
}

function identifyDominantDrivers(dimensions: Dimensions): string[] {
  const drivers: string[] = [];
  
  if (dimensions.workforceIntensity === "high") {
    drivers.push("Workforce Intensity");
  }
  if (dimensions.coordinationEntropy === "high") {
    drivers.push("Coordination Entropy");
  }
  if (dimensions.commercialExposure === "high") {
    drivers.push("Commercial Exposure");
  }
  if (dimensions.volatilityControl === "high") {
    drivers.push("Volatility Control");
  }
  if (dimensions.confidenceSignal === "negative") {
    drivers.push("Confidence Signal");
  }
  
  if (drivers.length === 0) {
    drivers.push("No High-Risk Drivers");
  }
  
  return drivers;
}

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  Object.getOwnPropertyNames(obj).forEach(name => {
    const value = (obj as any)[name];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  });
  
  return Object.freeze(obj);
}

export function executeDecisionEngine(input: AssessmentInput): DecisionObject {
  const engineInput: EngineAssessmentInput = {
    fullName: input.fullName,
    workEmail: input.workEmail,
    roleTitle: input.roleTitle,
    organisationName: input.organisationName,
    organisationSize: input.organisationSize,
    decisionType: input.decisionType,
    specifyContext: input.specifyContext,
    engagementClassification: input.engagementClassification,
    engagementType: input.engagementType,
    clientVolatility: input.clientVolatility,
    stakeholderComplexity: input.stakeholderComplexity,
    seniorLeadershipInvolvement: input.seniorLeadershipInvolvement,
    midLevelOversight: input.midLevelOversight,
    executionThinkingMix: input.executionThinkingMix,
    iterationIntensity: input.iterationIntensity,
    scopeChangeLikelihood: input.scopeChangeLikelihood,
    crossFunctionalCoordination: input.crossFunctionalCoordination,
    aiEffortShift: input.aiEffortShift,
    marginalValueSaturation: input.marginalValueSaturation,
    seniorOversightLoad: input.seniorOversightLoad,
    coordinationDecisionDrag: input.coordinationDecisionDrag,
    deliveryConfidence: input.deliveryConfidence,
    aiHumanHoursReplaced: input.aiHumanHoursReplaced,
    aiCommercialImpactMeasured: input.aiCommercialImpactMeasured,
    aiAgenticFramework: input.aiAgenticFramework,
    openSignal: input.openSignal
  };

  const engineOutput = runMarginMix(engineInput);

  const bucketScores: BucketScores = {
    WI: engineOutput.computationTrace.dimensions.workforceIntensity.score,
    CO: engineOutput.computationTrace.dimensions.coordinationEntropy.score,
    CE: engineOutput.computationTrace.dimensions.commercialExposure.score,
    VC: engineOutput.computationTrace.dimensions.volatilityControl.score,
    MM: engineOutput.computationTrace.dimensions.measurementMaturity.score
  };

  const bucketBands = {
    WI: levelToBand(engineOutput.dimensions.workforceIntensity),
    CO: levelToBand(engineOutput.dimensions.coordinationEntropy),
    CE: levelToBand(engineOutput.dimensions.commercialExposure),
    VC: levelToBand(engineOutput.dimensions.volatilityControl),
    MM: levelToBand(engineOutput.dimensions.measurementMaturity)
  };

  const saturationFlags: SaturationFlags = {
    valueSaturationPresent: engineOutput.dimensions.commercialExposure === "high" && 
                            engineOutput.dimensions.workforceIntensity === "high",
    upwardCostShift: engineOutput.signals.seniorDependency === "high" && 
                     engineOutput.dimensions.commercialExposure === "high"
  };

  const compositeScore = engineOutput.computationTrace.compositeBeforeRounding;

  const decisionObject: DecisionObject = {
    id: generateDecisionId(),
    engagementContext: {
      type: input.engagementType,
      classification: input.engagementClassification,
      organisationName: input.organisationName,
      organisationSize: input.organisationSize,
      roleTitle: input.roleTitle,
      fullName: input.fullName,
      workEmail: input.workEmail,
      specifyContext: input.specifyContext,
      decisionType: input.decisionType
    },
    marginRiskVerdict: engineOutput.verdict,
    riskBand: verdictToRiskBand(engineOutput.verdict),
    dimensions: engineOutput.dimensions,
    signals: engineOutput.signals,
    bucketScores,
    bucketBands,
    valueSaturationFlag: saturationFlags.valueSaturationPresent,
    saturationDetails: saturationFlags,
    aiImpactClassification: computeAIImpact(engineOutput.signals),
    aiEffortShiftLabel: getAIEffortShiftLabel(input.aiEffortShift),
    dominantDrivers: identifyDominantDrivers(engineOutput.dimensions),
    contradictionFlags: engineOutput.flags,
    verdictReason: engineOutput.verdictReason,
    triggeredBy: engineOutput.triggeredBy,
    compositeRiskScore: Math.round(compositeScore * 10) / 10,
    createdAt: new Date().toISOString(),
    computationTrace: engineOutput.computationTrace
  };

  return deepFreeze(decisionObject) as DecisionObject;
}

// Types are exported from the interface definitions above
