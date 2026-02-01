/**
 * effortAllocator.ts - Verdict to Effort Allocation Mapping
 * 
 * Effort allocation is derived ONLY after the verdict is decided.
 * It does NOT influence verdicts. It describes how structural load
 * manifests during delivery.
 * 
 * Mapping:
 * - Structurally Safe → 20% Senior / 25% Mid / 55% Execution
 * - Price Sensitive → 30% / 30% / 40%
 * - Execution Heavy → 25% / 40% / 35%
 * - Structurally Fragile → 45% / 35% / 20%
 * - Do Not Proceed Without Repricing → 50% / 35% / 15%
 */

import { Verdict, EffortAllocation } from "./types";

export interface EffortBands {
  seniorBand: "Low" | "Medium" | "High" | "Very High";
  midBand: "Low" | "Medium" | "High";
  executionBand: "Low" | "Medium" | "High";
}

export function allocateEffort(verdict: Verdict): EffortAllocation {
  switch (verdict) {
    case "Structurally Safe":
      return { senior: 20, mid: 25, execution: 55 };
    case "Price Sensitive":
      return { senior: 30, mid: 30, execution: 40 };
    case "Execution Heavy":
      return { senior: 25, mid: 40, execution: 35 };
    case "Structurally Fragile":
      return { senior: 45, mid: 35, execution: 20 };
    case "Do Not Proceed Without Repricing":
      return { senior: 50, mid: 35, execution: 15 };
    default:
      return { senior: 30, mid: 30, execution: 40 };
  }
}

export function getEffortBands(verdict: Verdict): EffortBands {
  switch (verdict) {
    case "Structurally Safe":
      return { seniorBand: "Low", midBand: "Low", executionBand: "High" };
    case "Price Sensitive":
      return { seniorBand: "Medium", midBand: "Medium", executionBand: "Medium" };
    case "Execution Heavy":
      return { seniorBand: "Medium", midBand: "High", executionBand: "Medium" };
    case "Structurally Fragile":
      return { seniorBand: "High", midBand: "High", executionBand: "Low" };
    case "Do Not Proceed Without Repricing":
      return { seniorBand: "Very High", midBand: "High", executionBand: "Low" };
    default:
      return { seniorBand: "Medium", midBand: "Medium", executionBand: "Medium" };
  }
}

export function getEffortInterpretation(verdict: Verdict): string {
  switch (verdict) {
    case "Structurally Safe":
      return "Delivery-led engagement with limited senior oversight";
    case "Price Sensitive":
      return "Front-loaded senior effort required to protect pricing";
    case "Execution Heavy":
      return "Coordination overhead dominates execution";
    case "Structurally Fragile":
      return "Sustained senior involvement required to prevent margin erosion";
    case "Do Not Proceed Without Repricing":
      return "Structural load exceeds safe pricing assumptions";
    default:
      return "Standard effort distribution";
  }
}
