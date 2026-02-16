
import { Signals } from "./types";
import { mapDimensions } from "./dimensionMapper";
import { decideVerdict } from "./decisionTable";
import { allocateEffort } from "./effortAllocator";

export function runMarginMix(signals: Signals) {
  const dimensions = mapDimensions(signals);
  const decision = decideVerdict(dimensions);
  const effort = allocateEffort(decision.verdict);

  return {
    signals,
    dimensions,
    verdict: decision.verdict,
    flags: decision.flags,
    effortAllocation: effort
  };
}
