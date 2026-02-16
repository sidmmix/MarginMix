
// verdict.ts
// Canonical MarginMix verdict definitions and precedence rules

export type Verdict =
  | "Structurally Safe"
  | "Execution Heavy"
  | "Price Sensitive"
  | "Structurally Fragile"
  | "Do Not Proceed Without Repricing";

export const VerdictPrecedence: Verdict[] = [
  "Do Not Proceed Without Repricing",
  "Structurally Fragile",
  "Price Sensitive",
  "Execution Heavy",
  "Structurally Safe"
];

export interface VerdictResult {
  verdict: Verdict;
  reason: string;
  triggeredBy: string[];
}
