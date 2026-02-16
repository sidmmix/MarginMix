
import { Signals, Level, Confidence } from "./types";

export interface Dimensions {
  workforceIntensity: Level;
  coordinationEntropy: Level;
  commercialExposure: Level;
  volatilityControl: Level;
  confidenceSignal: Confidence;
  measurementMaturity: Level;
}

export function mapDimensions(s: Signals): Dimensions {
  const workforceIntensity: Level =
    s.seniorDependency === "high" && s.iterationLoad === "high" ? "high" :
    s.seniorDependency === "medium" ? "medium" : "low";

  const coordinationEntropy: Level =
    s.stakeholderLoad === "high" && s.coordinationLoad === "high" ? "high" :
    s.stakeholderLoad === "medium" ? "medium" : "low";

  const commercialExposure: Level =
    s.scopeElasticity === "high" ? "high" :
    s.scopeElasticity === "medium" ? "medium" : "low";

  const volatilityControl: Level =
    s.clientVolatility === "high" ? "high" : "medium";

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
    measurementMaturity: s.measurementMaturity,
  };
}
