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
 * 5. Allocate effort based on verdict (effortAllocator)
 * 
 * AI is NOT used in this engine. AI may only be used externally
 * to narrate the already-computed outputs.
 */

import { Signals, Dimensions, EngineOutput } from "./types";
import { AssessmentInput, mapQuestionsToSignals, extractIdentifiers, IdentifierFields } from "./questionMapper";
import { mapDimensions } from "./dimensionMapper";
import { decideVerdict } from "./decisionTable";
import { detectContradictions } from "./contradictionDetector";
import { allocateEffort, getEffortBands, getEffortInterpretation, EffortBands } from "./effortAllocator";

export interface FullEngineOutput extends EngineOutput {
  identifiers: IdentifierFields;
  effortBands: EffortBands;
  effortInterpretation: string;
}

export function runMarginMix(input: AssessmentInput): FullEngineOutput {
  const identifiers = extractIdentifiers(input);
  
  const signals = mapQuestionsToSignals(input);
  
  const dimensions = mapDimensions(signals);
  
  const decision = decideVerdict(dimensions);
  
  const flags = detectContradictions(signals);
  
  const effortAllocation = allocateEffort(decision.verdict);
  const effortBands = getEffortBands(decision.verdict);
  const effortInterpretation = getEffortInterpretation(decision.verdict);

  return {
    identifiers,
    signals,
    dimensions,
    verdict: decision.verdict,
    verdictReason: decision.reason,
    triggeredBy: decision.triggeredBy,
    flags,
    effortAllocation,
    effortBands,
    effortInterpretation
  };
}

export type { AssessmentInput } from "./questionMapper";
export type { Signals, Dimensions, Verdict, EngineOutput, EffortAllocation, ContradictionFlag } from "./types";
