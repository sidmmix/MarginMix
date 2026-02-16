
export type Level = "low" | "medium" | "high";
export type Confidence = "positive" | "neutral" | "negative";

export type Verdict =
  | "Structurally Safe"
  | "Price Sensitive"
  | "Execution Heavy"
  | "Structurally Fragile"
  | "Do Not Proceed Without Repricing";

export interface Signals {
  clientVolatility: Level;
  stakeholderLoad: Level;
  seniorDependency: Level;
  coordinationLoad: Level;
  iterationLoad: Level;
  scopeElasticity: Level;
  pricingConfidence: Confidence;
  deliveryConfidence: Confidence;
  measurementMaturity: Level;
  aiLeverage: Level;
}
