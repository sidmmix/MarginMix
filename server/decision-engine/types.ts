/**
 * types.ts - Canonical MarginMix Type Definitions
 * 
 * All decision logic types are defined here.
 * Signals are atomic, strongly typed with enums/unions.
 * No scoring or weighting at this stage.
 */

export type Level = "low" | "medium" | "high";
export type Confidence = "positive" | "neutral" | "negative";

export type Verdict =
  | "Structurally Safe"
  | "Price Sensitive"
  | "Execution Heavy"
  | "Structurally Fragile"
  | "Do Not Proceed Without Repricing";

export const VerdictPrecedence: Verdict[] = [
  "Do Not Proceed Without Repricing",
  "Structurally Fragile",
  "Price Sensitive",
  "Execution Heavy",
  "Structurally Safe"
];

export interface Signals {
  clientVolatility: Level;
  stakeholderLoad: Level;
  seniorDependency: Level;
  coordinationLoad: Level;
  iterationLoad: Level;
  scopeElasticity: Level;
  pricingConfidence: Confidence;
  deliveryConfidence: Confidence;
  measurementMaturity: Level;
  aiLeverage: Level;
  engagementState: "new" | "ongoing" | "escalation" | "renewal" | "strategic";
  pricingRigidity: Level;
  teamMaturity: Level;
  resourcingFlex: Level;
  governanceStrength: Level;
}

export interface Dimensions {
  workforceIntensity: Level;
  coordinationEntropy: Level;
  commercialExposure: Level;
  volatilityControl: Level;
  confidenceSignal: Confidence;
  measurementMaturity: Level;
}

export interface VerdictResult {
  verdict: Verdict;
  reason: string;
  triggeredBy: string[];
}

export interface EffortAllocation {
  senior: number;
  mid: number;
  execution: number;
}

export interface ContradictionFlag {
  code: string;
  description: string;
  severity: "warning" | "info";
}

export interface EngineOutput {
  signals: Signals;
  dimensions: Dimensions;
  verdict: Verdict;
  verdictReason: string;
  triggeredBy: string[];
  flags: ContradictionFlag[];
  effortAllocation: EffortAllocation;
}
