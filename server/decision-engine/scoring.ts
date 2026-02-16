/**
 * scoring.ts - Enum to Numeric Mapping Layer
 * 
 * Maps all assessment dropdown options to normalized 0-100 scores.
 * This is a pure, deterministic mapping with no business logic.
 */

export interface RawAssessmentInput {
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
  deliveryConfidence: string;
}

export interface NormalizedScores {
  clientVolatility: number;
  stakeholderComplexity: number;
  seniorLeadershipInvolvement: number;
  midLevelOversight: number;
  executionThinkingMix: number;
  iterationIntensity: number;
  scopeChangeLikelihood: number;
  crossFunctionalCoordination: number;
  aiEffortShift: number;
  marginalValueSaturation: number;
  seniorOversightLoad: number;
  coordinationDecisionDrag: number;
  deliveryConfidence: number;
}

export const SCORE_MAP: Record<string, Record<string, number>> = {
  clientVolatility: {
    "stable": 15,
    "mostly_stable": 30,
    "somewhat_unpredictable": 55,
    "highly_unpredictable": 80,
    "extremely_volatile": 95
  },
  
  stakeholderComplexity: {
    "single_decision_maker": 15,
    "small_group": 35,
    "multiple_stakeholders": 55,
    "complex_matrix": 75,
    "highly_complex": 90
  },
  
  seniorLeadershipInvolvement: {
    "rarely": 20,
    "occasionally": 40,
    "regularly": 60,
    "frequently": 80,
    "constantly": 95
  },
  
  midLevelOversight: {
    "minimal": 20,
    "standard": 40,
    "moderate": 55,
    "heavy": 75,
    "constant": 90
  },
  
  executionThinkingMix: {
    "mostly_execution": 20,
    "execution_heavy": 35,
    "balanced": 50,
    "thinking_heavy": 70,
    "mostly_thinking": 85
  },
  
  iterationIntensity: {
    "minimal": 15,
    "low": 30,
    "moderate": 50,
    "high": 75,
    "extreme": 95
  },
  
  scopeChangeLikelihood: {
    "very_unlikely": 15,
    "unlikely": 30,
    "possible": 50,
    "likely": 75,
    "very_likely": 90
  },
  
  crossFunctionalCoordination: {
    "none": 10,
    "minimal": 25,
    "moderate": 50,
    "significant": 70,
    "extensive": 90
  },
  
  aiEffortShift: {
    "junior_execution": 20,
    "mid_level_production": 45,
    "senior_thinking_review": 75,
    "no_clear_substitution": 80
  },
  
  marginalValueSaturation: {
    "significant": 20,
    "moderate": 45,
    "diminishing": 70,
    "minimal": 90
  },
  
  seniorOversightLoad: {
    "less_than_usual": 25,
    "about_same": 50,
    "more_than_usual": 75,
    "significantly_more": 90
  },
  
  coordinationDecisionDrag: {
    "minimal": 20,
    "moderate": 50,
    "significant": 75,
    "severe": 95
  },
  
  deliveryConfidence: {
    "high": 20,
    "moderate": 50,
    "low": 75,
    "very_low": 95
  }
};

export const ENGAGEMENT_CONTEXT_MAP: Record<string, string> = {
  "new": "new_pitch",
  "renewal": "renewal",
  "expansion": "scope_expansion",
  "rescue": "delivery_escalation",
  "strategic": "strategic_high_visibility"
};

export function normalizeScores(input: RawAssessmentInput): NormalizedScores {
  const scores: NormalizedScores = {
    clientVolatility: SCORE_MAP.clientVolatility[input.clientVolatility] ?? 50,
    stakeholderComplexity: SCORE_MAP.stakeholderComplexity[input.stakeholderComplexity] ?? 50,
    seniorLeadershipInvolvement: SCORE_MAP.seniorLeadershipInvolvement[input.seniorLeadershipInvolvement] ?? 50,
    midLevelOversight: SCORE_MAP.midLevelOversight[input.midLevelOversight] ?? 50,
    executionThinkingMix: SCORE_MAP.executionThinkingMix[input.executionThinkingMix] ?? 50,
    iterationIntensity: SCORE_MAP.iterationIntensity[input.iterationIntensity] ?? 50,
    scopeChangeLikelihood: SCORE_MAP.scopeChangeLikelihood[input.scopeChangeLikelihood] ?? 50,
    crossFunctionalCoordination: SCORE_MAP.crossFunctionalCoordination[input.crossFunctionalCoordination] ?? 50,
    aiEffortShift: SCORE_MAP.aiEffortShift[input.aiEffortShift] ?? 50,
    marginalValueSaturation: SCORE_MAP.marginalValueSaturation[input.marginalValueSaturation] ?? 50,
    seniorOversightLoad: SCORE_MAP.seniorOversightLoad[input.seniorOversightLoad] ?? 50,
    coordinationDecisionDrag: SCORE_MAP.coordinationDecisionDrag[input.coordinationDecisionDrag] ?? 50,
    deliveryConfidence: SCORE_MAP.deliveryConfidence[input.deliveryConfidence] ?? 50
  };
  
  return scores;
}

export function getEngagementContext(classification: string): string {
  return ENGAGEMENT_CONTEXT_MAP[classification] ?? "new_pitch";
}
