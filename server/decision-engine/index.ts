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
 * 5. Allocate effort based on verdict (effortAllocator)
 * 6. Build canonical decision object for rendering
 * 
 * AI is NOT used in this engine. AI may only be used externally
 * to narrate the already-computed outputs.
 */

import { runMarginMix, FullEngineOutput, AssessmentInput as EngineAssessmentInput } from "./engine";
import { Verdict, Level, Confidence, EffortAllocation, ContradictionFlag, Dimensions, Signals } from "./types";

export interface AssessmentInput {
  fullName: string;
  workEmail: string;
  roleTitle: string;
  organisationName: string;
  organisationSize: string;
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
  aiImpactMeasurement: string;
  marginalValueSaturation: string;
  seniorOversightLoad: string;
  coordinationDecisionDrag: string;
  deliveryConfidence: string;
  openSignal?: string;
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
  SI: number;
  CO: number;
  VSI: number;
  CE: number;
}

export interface SaturationFlags {
  valueSaturationPresent: boolean;
  opticsDrivenStaffing: boolean;
  upwardCostShift: boolean;
}

export type AIImpactClassification = "Accretive" | "Neutral" | "Fragile" | "Dilutive";
export type RiskSource = "Structural" | "Behavioral" | "Technology-Amplified" | "Mixed";
export type Correctability = "Correctable" | "Correctable with Redesign" | "Not Correctable";

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
    SI: string;
    CO: string;
    VSI: string;
    CE: string;
  };
  readonly valueSaturationFlag: boolean;
  readonly saturationDetails: SaturationFlags;
  readonly aiImpactClassification: AIImpactClassification;
  readonly riskSource: RiskSource;
  readonly dominantDrivers: readonly string[];
  readonly contradictionFlags: readonly ContradictionFlag[];
  readonly correctability: Correctability;
  readonly effortBand: string;
  readonly effortPercentages: {
    senior: string;
    mid: string;
    junior: string;
  };
  readonly effortAllocation: EffortAllocation;
  readonly verdictReason: string;
  readonly triggeredBy: readonly string[];
  readonly compositeRiskScore: number;
  readonly createdAt: string;
}

function generateDecisionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `DEC-${timestamp}-${random}`.toUpperCase();
}

/**
 * levelToScore - Display-only numeric representation
 * 
 * IMPORTANT: These scores are used ONLY for PDF/UI rendering.
 * They are NOT used in verdict logic, which is purely rule-based.
 * The decision engine uses Level/Confidence types exclusively.
 */
function levelToScore(level: Level): number {
  switch (level) {
    case "low": return 25;
    case "medium": return 50;
    case "high": return 75;
    default: return 50;
  }
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

function verdictToEffortBand(verdict: Verdict): string {
  switch (verdict) {
    case "Structurally Safe": return "Low Effort";
    case "Execution Heavy": return "Moderate Effort";
    case "Price Sensitive": return "Moderate Effort";
    case "Structurally Fragile": return "High Effort";
    case "Do Not Proceed Without Repricing": return "Very High Effort";
    default: return "Moderate Effort";
  }
}

function computeAIImpact(signals: Signals): AIImpactClassification {
  if (signals.aiLeverage === "high" && signals.measurementMaturity === "high") {
    return "Accretive";
  }
  if (signals.aiLeverage === "low") {
    return "Neutral";
  }
  if (signals.aiLeverage === "high" && signals.measurementMaturity === "low") {
    return "Dilutive";
  }
  return "Neutral";
}

function computeRiskSource(dimensions: Dimensions): RiskSource {
  const sources: string[] = [];
  
  if (dimensions.workforceIntensity === "high") {
    sources.push("Structural");
  }
  if (dimensions.coordinationEntropy === "high") {
    sources.push("Behavioral");
  }
  if (dimensions.measurementMaturity === "low" && dimensions.workforceIntensity === "high") {
    sources.push("Technology-Amplified");
  }
  
  if (sources.length === 0) return "Structural";
  if (sources.length === 1) return sources[0] as RiskSource;
  return "Mixed";
}

function computeCorrectability(dimensions: Dimensions, verdict: Verdict): Correctability {
  if (verdict === "Structurally Safe" || verdict === "Execution Heavy") {
    return "Correctable";
  }
  if (verdict === "Price Sensitive") {
    return "Correctable with Redesign";
  }
  if (verdict === "Do Not Proceed Without Repricing") {
    return "Not Correctable";
  }
  return "Correctable with Redesign";
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
    aiImpactMeasurement: input.aiImpactMeasurement,
    marginalValueSaturation: input.marginalValueSaturation,
    seniorOversightLoad: input.seniorOversightLoad,
    coordinationDecisionDrag: input.coordinationDecisionDrag,
    deliveryConfidence: input.deliveryConfidence,
    openSignal: input.openSignal
  };

  const engineOutput = runMarginMix(engineInput);

  const bucketScores: BucketScores = {
    WI: levelToScore(engineOutput.dimensions.workforceIntensity),
    SI: levelToScore(engineOutput.signals.seniorDependency),
    CO: levelToScore(engineOutput.dimensions.coordinationEntropy),
    VSI: levelToScore(engineOutput.dimensions.commercialExposure),
    CE: engineOutput.dimensions.confidenceSignal === "negative" ? 75 : 
        engineOutput.dimensions.confidenceSignal === "neutral" ? 50 : 25
  };

  const bucketBands = {
    WI: levelToBand(engineOutput.dimensions.workforceIntensity),
    SI: levelToBand(engineOutput.signals.seniorDependency),
    CO: levelToBand(engineOutput.dimensions.coordinationEntropy),
    VSI: levelToBand(engineOutput.dimensions.commercialExposure),
    CE: engineOutput.dimensions.confidenceSignal === "negative" ? "High" : 
        engineOutput.dimensions.confidenceSignal === "neutral" ? "Moderate" : "Low"
  };

  const saturationFlags: SaturationFlags = {
    valueSaturationPresent: engineOutput.dimensions.commercialExposure === "high" && 
                            engineOutput.dimensions.workforceIntensity === "high",
    opticsDrivenStaffing: engineOutput.dimensions.coordinationEntropy === "high" && 
                          engineOutput.dimensions.commercialExposure === "high",
    upwardCostShift: engineOutput.signals.seniorDependency === "high" && 
                     engineOutput.dimensions.commercialExposure === "high"
  };

  // NOTE: compositeScore is for DISPLAY/RENDERING ONLY
  // It is NOT used in verdict determination, which is purely rule-based
  const compositeScore = (bucketScores.WI * 0.3 + bucketScores.SI * 0.25 + 
                          bucketScores.CO * 0.25 + bucketScores.VSI * 0.2);

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
    riskSource: computeRiskSource(engineOutput.dimensions),
    dominantDrivers: identifyDominantDrivers(engineOutput.dimensions),
    contradictionFlags: engineOutput.flags,
    correctability: computeCorrectability(engineOutput.dimensions, engineOutput.verdict),
    effortBand: verdictToEffortBand(engineOutput.verdict),
    effortPercentages: {
      senior: `${engineOutput.effortAllocation.senior}%`,
      mid: `${engineOutput.effortAllocation.mid}%`,
      junior: `${engineOutput.effortAllocation.execution}%`
    },
    effortAllocation: engineOutput.effortAllocation,
    verdictReason: engineOutput.verdictReason,
    triggeredBy: engineOutput.triggeredBy,
    compositeRiskScore: Math.round(compositeScore * 10) / 10,
    createdAt: new Date().toISOString()
  };

  return deepFreeze(decisionObject) as DecisionObject;
}

// Types are exported from the interface definitions above
