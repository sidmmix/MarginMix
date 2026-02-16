
export type Level = "low" | "medium" | "high";
export type Confidence = "positive" | "neutral" | "negative";

export interface Signals {
  workforceLoad: Level;
  coordinationLoad: Level;
  scopeElasticity: Level;
  clientVolatility: Level;
  pricingConfidence: Confidence;
  deliveryConfidence: Confidence;
  measurementMaturity: Level;
  aiLeverage: Level;
}
