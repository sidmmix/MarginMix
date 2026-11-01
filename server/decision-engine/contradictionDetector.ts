/**
 * contradictionDetector.ts - Soft Flags for Inconsistent Inputs
 * 
 * Implements contradiction detection for inconsistent inputs.
 * Contradictions add explanatory flags but do NOT downgrade risk.
 * 
 * Examples of contradictions:
 * - High volatility + High confidence
 * - Fixed fee + High scope elasticity
 */

import { Signals, ContradictionFlag } from "./types";
import type { AssessmentInput } from "./questionMapper";

/** Answer-level advisory only: never used to map signals, score, or decide a verdict. */
export function detectAIAnswerContradictions(
  input: Pick<AssessmentInput, "aiEffortShift" | "aiHumanHoursReplaced">,
): ContradictionFlag[] {
  if (input.aiEffortShift !== "no_clear_substitution") return [];
  const hourLabels: Record<string, string> = {
    "0-25": "0–25%", "25-50": "25–50%", "50-75": "50–75%", "75-100": "75–100%",
  };
  const hours = input.aiHumanHoursReplaced && hourLabels[input.aiHumanHoursReplaced];
  if (!hours) return [];
  const includesZero = input.aiHumanHoursReplaced === "0-25";
  return [{
    code: "UNCLEAR_AI_SUBSTITUTION_WITH_EXPECTED_HOURS",
    description: `AI substitution is described as "No clear substitution", while "${hours}" of human hours are expected to be replaced or augmented by an AI agent.${includesZero ? " This band includes zero; clarify whether any hours are expected to be replaced before treating this as a confirmed contradiction." : ""}`,
    severity: includesZero ? "info" : "warning",
  }];
}

export function detectContradictions(s: Signals): ContradictionFlag[] {
  const flags: ContradictionFlag[] = [];

  if (s.clientVolatility === "high" && s.deliveryConfidence === "positive") {
    flags.push({
      code: "HIGH_VOLATILITY_HIGH_CONFIDENCE",
      description: "High client volatility paired with high delivery confidence may indicate optimism bias. Consider stress-testing assumptions.",
      severity: "warning"
    });
  }

  if (s.pricingRigidity === "high" && s.scopeElasticity === "high") {
    flags.push({
      code: "FIXED_FEE_HIGH_SCOPE",
      description: "Fixed fee pricing with high scope elasticity creates margin exposure. Consider scope protection mechanisms.",
      severity: "warning"
    });
  }

  if (s.seniorDependency === "high" && s.teamMaturity === "high") {
    flags.push({
      code: "SENIOR_HEAVY_MATURE_TEAM",
      description: "High senior dependency despite mature team composition may indicate governance concerns or client expectations.",
      severity: "info"
    });
  }

  if (s.coordinationLoad === "high" && s.measurementMaturity === "high") {
    flags.push({
      code: "HIGH_COORD_LOW_MEASUREMENT",
      description: "High coordination requirements alongside high AI Substitution and Measurement Risk warrant reviewing AI impact measurement and coordination controls.",
      severity: "warning"
    });
  }

  if (s.clientVolatility === "low" && s.scopeElasticity === "high") {
    flags.push({
      code: "STABLE_CLIENT_HIGH_SCOPE",
      description: "Stable client relationship paired with high scope elasticity may indicate internal process gaps.",
      severity: "info"
    });
  }

  if (s.aiLeverage === "low" && s.measurementMaturity === "high") {
    flags.push({
      code: "AI_EFFORT_SHIFT_NEGATIVE",
      description: "AI is expected to substitute senior thinking or has no clear substitution — increased oversight cost likely offsets any efficiency gains.",
      severity: "warning"
    });
  }

  if (s.pricingConfidence === "positive" && s.deliveryConfidence === "negative") {
    flags.push({
      code: "PRICING_DELIVERY_MISMATCH",
      description: "Strong pricing confidence with weak delivery confidence suggests execution risk may not be priced in.",
      severity: "warning"
    });
  }

  if (s.stakeholderLoad === "low" && s.coordinationLoad === "high") {
    flags.push({
      code: "LOW_STAKEHOLDER_HIGH_COORD",
      description: "Low stakeholder complexity with high coordination load may indicate internal process inefficiencies.",
      severity: "info"
    });
  }

  return flags;
}
