/**
 * engine.ts - Main Orchestrator
 * 
 * Single orchestrator that ties together all decision engine layers.
 * Returns the canonical output object which is the ONLY source of truth.
 * 
 * Flow:
 * 1. Map questions to signals (questionMapper)
 * 2. Map signals to dimensions (dimensionMapper)
 * 3. Decide verdict using decision table (decisionTable)
 * 4. Detect contradictions (contradictionDetector)
 * Numeric scoring uses the supplied Model1 scorecard, independently of descriptive levels.
 * 
 * AI is NOT used in this engine. AI may only be used externally
 * to narrate the already-computed outputs.
 */

import { Signals, Dimensions, EngineOutput } from "./types";
import { AssessmentInput, mapQuestionsToSignals, extractIdentifiers, IdentifierFields } from "./questionMapper";
import { mapDimensions, mapConfidenceSignal } from "./dimensionMapper";
import { decideVerdict } from "./decisionTable";
import { detectContradictions } from "./contradictionDetector";
import { buildComputationTrace, type ComputationTrace } from "./scorecard";

export interface FullEngineOutput extends EngineOutput {
  identifiers: IdentifierFields;
  computationTrace: ComputationTrace;
}

export function runMarginMix(input: AssessmentInput): FullEngineOutput {
  const identifiers = extractIdentifiers(input);
  
  const signals = mapQuestionsToSignals(input);
  
  const computationTrace = buildComputationTrace(input);
  // The scorer receives only numeric means plus the unchanged confidence override.
  const decision = decideVerdict({ confidenceSignal: mapConfidenceSignal(signals) }, computationTrace);
  // Retain existing descriptive levels for narrative compatibility only.
  // Numeric scores and verdicts come exclusively from the scorecard trace.
  const dimensions = mapDimensions(signals);
  
  if (!input.deliveryConfidence?.trim()) delete dimensions.confidenceSignal;
  
  const flags = detectContradictions(signals);
  
  return {
    identifiers,
    signals,
    dimensions,
    verdict: decision.verdict,
    verdictReason: decision.reason,
    triggeredBy: decision.triggeredBy,
    weightedScore: decision.weightedScore,
    flags,
    computationTrace
  };
}

export type { AssessmentInput } from "./questionMapper";
export type { Signals, Dimensions, Verdict, EngineOutput, EffortAllocation, ContradictionFlag } from "./types";
