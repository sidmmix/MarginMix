import { INPUT_BOUNDS, INPUT_WARNINGS } from "./constants";
import type { LeakInput } from "./types";

export interface FieldErrors {
  fee?: string;
  months?: string;
  fte?: string;
  staffcost?: string;
  scopemove?: string;
  scopebilled?: string;
  hourstracked?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: FieldErrors;
  warnings: string[];
}

export function validateLeakInput(raw: Partial<LeakInput>): ValidationResult {
  const errors: FieldErrors = {};
  const warnings: string[] = [];

  const fee = Number(raw.fee);
  const months = Number(raw.months);
  const fte = Number(raw.fte);
  const staffcost = Number(raw.staffcost);

  if (!Number.isFinite(fee) || fee <= 0) {
    errors.fee = "Enter a fee greater than zero.";
  }
  if (!Number.isFinite(months) || months < INPUT_BOUNDS.months.min || months > INPUT_BOUNDS.months.max) {
    errors.months = `Enter months between ${INPUT_BOUNDS.months.min} and ${INPUT_BOUNDS.months.max}.`;
  }
  if (!Number.isFinite(fte) || fte < INPUT_BOUNDS.fte.min || fte > INPUT_BOUNDS.fte.max) {
    errors.fte = `Enter FTE between ${INPUT_BOUNDS.fte.min} and ${INPUT_BOUNDS.fte.max}.`;
  }
  if (!Number.isFinite(staffcost) || staffcost <= 0) {
    errors.staffcost = "Enter staff cost greater than zero.";
  }
  if (!raw.scopemove) errors.scopemove = "Select scope movement.";
  if (!raw.scopebilled) errors.scopebilled = "Select scope billing status.";
  if (!raw.hourstracked) errors.hourstracked = "Select hours tracked.";

  if (Object.keys(errors).length === 0) {
    if (staffcost > fee * INPUT_WARNINGS.staffCostHigh) {
      warnings.push("Check this figure. Staff cost is more than three times the fee.");
    }
    if (staffcost < fee * INPUT_WARNINGS.staffCostLow) {
      warnings.push("Check this figure. Staff cost is under a tenth of the fee.");
    }
    if (fte * months < INPUT_WARNINGS.minPersonMonths) {
      warnings.push("That is less than one person-month of work. Check the numbers.");
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, warnings };
}
