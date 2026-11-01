import type { AssessmentInput } from "./questionMapper";

/** Formulas and points from the supplied Model1 scorecard; no intermediate rounding. */
export const WEIGHTS = {
  workforceIntensity: 30,
  coordinationEntropy: 25,
  commercialExposure: 20,
  volatilityControl: 15,
  measurementMaturity: 10,
} as const;

export type ScoredDimension = keyof typeof WEIGHTS;
export interface SignalScore {
  name: string;
  questions: { question: string; answer: string; score: number }[];
  aggregation: "identity" | "maximum";
  score: number;
}
export interface ComputationTrace {
  model: "Model1";
  dimensions: Record<ScoredDimension, {
    signals: SignalScore[];
    aggregation: "arithmetic_mean";
    score: number;
    weight: number;
    weightedContribution: number;
  }>;
  compositeBeforeRounding: number;
}

const levels: Record<string, number> = { low: 0, medium: 50, high: 100 };
const pricePoints: Record<string, number> = {
  retainer: 0, "fixed-fee": 100, commission: 100, "outcome-based": 100,
  hybrid: 50, "hybrid-retainer-commission": 50, "hybrid-retainer-outcome": 50,
  "ites-tm": 50, "ites-fixed-price": 100, "ites-managed-services": 50,
  "ites-retainer": 0, "ites-outcome": 100, "ites-hybrid": 50,
  "mc-fixed-fee": 100, "mc-retainer": 0, "mc-tm": 50, "mc-outcome": 100, "mc-hybrid": 50,
  "sw-implementation": 100, "sw-managed-services": 50, "sw-saas-services": 50,
  "sw-fixed-price": 100, "sw-tm": 50, "sw-outcome": 100,
};

export function buildComputationTrace(input: AssessmentInput): ComputationTrace {
  const point = (question: string, answer: string | undefined, mapping: Record<string, number>) => {
    // Missing optional AI follow-ups are NA; unsupported answers are not silently scored.
    const value = answer ?? "na";
    if (!(value in mapping)) throw new Error(`Unsupported answer for ${question}: ${value}`);
    return { question, answer: value, score: mapping[value] };
  };
  type Point = ReturnType<typeof point>;
  const signal = (name: string, ...questions: Point[]): SignalScore => ({
    name, questions,
    aggregation: questions.length === 1 ? "identity" : "maximum",
    score: Math.max(...questions.map((q) => q.score)),
  });
  const groups: Record<ScoredDimension, SignalScore[]> = {
    workforceIntensity: [
      signal("SeniorDependency",
        point("Q13", input.seniorLeadershipInvolvement, { minimal: 0, periodic: 50, frequent: 100, continuous: 100 }),
        point("Q21", input.seniorOversightLoad, { less: 0, less_than_usual: 0, about_same: 50, more: 100, more_than_usual: 100 })),
      signal("IterationLoad proxy", point("Q15", input.executionThinkingMix, {
        "execution-heavy": 0, balanced: 50, "thinking-heavy": 100,
        "technical-implementation": 50, "advisory-solutioning": 100, "strategy-advisory": 100,
      })),
      signal("IterationLoad", point("Q16", input.iterationIntensity, levels)),
      signal("GovernanceStrength", point("Q20", input.marginalValueSaturation, { significant: 0, some: 50, minimal: 100, none: 100 })),
    ],
    coordinationEntropy: [
      signal("CoordinationIntensity", point("Q14", input.midLevelOversight, levels)),
      signal("CoordinationLoad",
        point("Q18", input.crossFunctionalCoordination, levels),
        point("Q22", input.coordinationDecisionDrag, { minimal: 0, moderate: 50, heavy: 100 })),
    ],
    commercialExposure: [
      signal("EngagementState",
        point("Q7", input.decisionType, {
          "new-client": 0, "new-client-win": 0, renewal: 0, "renewal-extension": 0, "scope-expansion": 100, escalation: 100,
          "strategic-exception": 50, exploratory: 0,
        }),
        point("Q9", input.engagementClassification, {
          new: 50, "ongoing-less-6": 50, "ongoing-6-12": 0, "ongoing-12-plus": 0, "renewal-expansion": 50,
        })),
      signal("PricingRigidity", point("Q10", input.engagementType, pricePoints)),
      signal("ScopeElasticity", point("Q17", input.scopeChangeLikelihood, levels)),
    ],
    volatilityControl: [
      signal("ClientVolatility", point("Q11", input.clientVolatility, levels)),
      signal("StakeholderLoad", point("Q12", input.stakeholderComplexity, levels)),
    ],
    measurementMaturity: [
      signal("AILeverage", point("Q19", input.aiEffortShift, {
        junior_execution: 0, mid_level_production: 50, senior_thinking_review: 100, no_clear_substitution: 100,
      })),
      signal("AIRiskPeak",
        point("Q24", input.aiAgenticFramework, { no: 0, yes: 100, na: 0 }),
        point("Q25", input.aiHumanHoursReplaced, { "0-25": 0, "25-50": 50, "50-75": 100, "75-100": 100, na: 0 }),
        point("Q26", input.aiCommercialImpactMeasured, { yes: 0, no: 100, na: 0 })),
    ],
  };
  const dimensions = {} as ComputationTrace["dimensions"];
  let compositeBeforeRounding = 0;
  for (const key of Object.keys(WEIGHTS) as ScoredDimension[]) {
    const signals = groups[key];
    const score = signals.reduce((sum, entry) => sum + entry.score, 0) / signals.length;
    const weight = WEIGHTS[key];
    const weightedContribution = score * weight / 100;
    dimensions[key] = { signals, aggregation: "arithmetic_mean", score, weight, weightedContribution };
    compositeBeforeRounding += weightedContribution;
  }
  return { model: "Model1", dimensions, compositeBeforeRounding };
}
