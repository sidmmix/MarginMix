
import { Verdict } from "./types";

export interface EffortAllocation {
  senior: number;
  mid: number;
  execution: number;
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
