import { computeLeak } from "./compute-leak";
import { validateLeakInput } from "./validate-input";
import type { LeakInput, LeakResult } from "./types";

/** Browser-only persistence is untrusted; recalculate with the current model. */
export function readStoredLeakResult(raw: string | null): LeakResult | null {
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw);
    if (!stored || typeof stored.input !== "object" || !stored.input) return null;
    const source = stored.input;
    const input: LeakInput = {
      fee: Number(source.fee),
      months: Number(source.months),
      fte: Number(source.fte),
      staffcost: Number(source.staffcost),
      targetMarginPercent: source.targetMarginPercent === undefined ? undefined : Number(source.targetMarginPercent),
      scopemove: source.scopemove,
      scopebilled: source.scopebilled,
      hourstracked: source.hourstracked,
    };
    if (!validateLeakInput(input).valid) return null;
    return computeLeak(input);
  } catch {
    return null;
  }
}
