
import { Dimensions, Verdict } from "./types";

export function decideVerdict(d: Dimensions): { verdict: Verdict; flags: string[] } {
  const flags: string[] = [];

  if (d.workforceIntensity === "high" && d.coordinationEntropy === "high") {
    flags.push("STRUCTURAL_OVERLOAD");
    return { verdict: "Structurally Fragile", flags };
  }

  if (d.confidenceSignal === "negative") {
    flags.push("LOW_CONFIDENCE");
    return { verdict: "Do Not Proceed Without Repricing", flags };
  }

  if (d.commercialExposure === "high") {
    return { verdict: "Price Sensitive", flags };
  }

  if (d.workforceIntensity === "high") {
    return { verdict: "Execution Heavy", flags };
  }

  return { verdict: "Structurally Safe", flags };
}
