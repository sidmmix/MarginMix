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

  if (s.coordinationLoad === "high" && s.measurementMaturity === "low") {
    flags.push({
      code: "HIGH_COORD_LOW_MEASUREMENT",
      description: "High coordination requirements with low measurement maturity reduces early warning capability.",
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

  if (s.aiLeverage === "high" && s.measurementMaturity === "low") {
    flags.push({
      code: "AI_LEVERAGE_NO_MEASUREMENT",
      description: "Claimed AI leverage without measurement capability limits value realization.",
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
