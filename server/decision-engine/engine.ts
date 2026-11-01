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
import { detectContradictions, detectAIAnswerContradictions } from "./contradictionDetector";
import { buildComputationTrace, type ComputationTrace } from "./scorecard";
import type { VerdictProvenance, VerdictTrigger } from "../../shared/verdict-provenance";

export interface FullEngineOutput extends EngineOutput {
  identifiers: IdentifierFields;
  computationTrace: ComputationTrace;
  verdictProvenance: VerdictProvenance;
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
  
  const flags = [...detectContradictions(signals), ...detectAIAnswerContradictions(input)];

  // Record why the EXISTING decision fired; this metadata does not participate in scoring.
  const overrides: VerdictTrigger[] = [];
  if (decision.triggeredBy.includes("LOW_CONFIDENCE_OVERRIDE")) {
    if (signals.pricingConfidence === "negative") {
      overrides.push({
        condition: "Negative pricing confidence", questionId: "Q20",
        question: "Compared to similar work, how much incremental value does adding more people create here?",
        answer: input.marginalValueSaturation,
        answerLabel: input.marginalValueSaturation === "minimal" ? "Minimal additional value" : "No meaningful additional value",
      });
    }
    if (signals.deliveryConfidence === "negative") {
      overrides.push({
        condition: "Low delivery confidence", questionId: "Q23",
        question: "How confident are you in the delivery model for this engagement?",
        answer: input.deliveryConfidence!, answerLabel: "Low confidence",
      });
    }
  }
  const verdictProvenance: VerdictProvenance = decision.triggeredBy.includes("LOW_CONFIDENCE_OVERRIDE")
    ? { path: "override", overrides }
    : { path: "weighted_score", weightedScoreBand: decision.verdict, overrides: [] };
  
  return {
    identifiers,
    signals,
    dimensions,
    verdict: decision.verdict,
    verdictReason: decision.reason,
    triggeredBy: decision.triggeredBy,
    weightedScore: decision.weightedScore,
    flags,
    computationTrace,
    verdictProvenance,
  };
}

export type { AssessmentInput } from "./questionMapper";
export type { Signals, Dimensions, Verdict, EngineOutput, EffortAllocation, ContradictionFlag } from "./types";
