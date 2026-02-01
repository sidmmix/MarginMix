/**
 * dimensionMapper.ts - Signal to Dimension Mapping Layer
 * 
 * Implements a deterministic Signal → Dimension mapper that produces:
 * - Workforce Intensity
 * - Coordination Entropy
 * - Commercial Exposure
 * - Volatility Control
 * - Confidence Signal
 * - Measurement Maturity
 * 
 * Uses explicit if-then promotion rules ONLY.
 * No averages, no math, no ML.
 */

import { Signals, Dimensions, Level, Confidence } from "./types";

export function mapDimensions(s: Signals): Dimensions {
  const workforceIntensity: Level =
    s.seniorDependency === "high" && s.iterationLoad === "high" ? "high" :
    s.seniorDependency === "high" || s.iterationLoad === "high" ? "high" :
    s.seniorDependency === "medium" || s.iterationLoad === "medium" ? "medium" : "low";

  const coordinationEntropy: Level =
    s.stakeholderLoad === "high" && s.coordinationLoad === "high" ? "high" :
    s.stakeholderLoad === "high" || s.coordinationLoad === "high" ? "high" :
    s.stakeholderLoad === "medium" || s.coordinationLoad === "medium" ? "medium" : "low";

  const commercialExposure: Level =
    s.scopeElasticity === "high" && s.pricingRigidity === "high" ? "high" :
    s.scopeElasticity === "high" ? "high" :
    s.scopeElasticity === "medium" ? "medium" : "low";

  const volatilityControl: Level =
    s.clientVolatility === "high" ? "high" :
    s.clientVolatility === "medium" ? "medium" : "low";

  const confidenceSignal: Confidence =
    s.pricingConfidence === "negative" || s.deliveryConfidence === "negative"
      ? "negative"
      : s.pricingConfidence === "positive" && s.deliveryConfidence === "positive"
      ? "positive"
      : "neutral";

  return {
    workforceIntensity,
    coordinationEntropy,
    commercialExposure,
    volatilityControl,
    confidenceSignal,
    measurementMaturity: s.measurementMaturity
  };
}
