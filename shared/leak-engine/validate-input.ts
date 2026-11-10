import {
  BILLING_MULTIPLIER,
  BAND_WIDTH,
  DEFAULT_TARGET_MARGIN_PERCENT,
  INPUT_BOUNDS,
  INPUT_WARNINGS,
  SCOPE_SHARE,
  TARGET_MARGIN_OPTIONS,
} from "./constants";
import type { LeakInput } from "./types";

export interface FieldErrors {
  fee?: string;
  months?: string;
  fte?: string;
  staffcost?: string;
  targetMarginPercent?: string;
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
  const targetMarginPercent = raw.targetMarginPercent === undefined
    ? DEFAULT_TARGET_MARGIN_PERCENT
    : Number(raw.targetMarginPercent);

  if (!Number.isFinite(fee) || fee <= 0) {
    errors.fee = "Enter a fee greater than zero.";
  }
  if (!Number.isInteger(months) || months < INPUT_BOUNDS.months.min || months > INPUT_BOUNDS.months.max) {
    errors.months = `Enter whole months between ${INPUT_BOUNDS.months.min} and ${INPUT_BOUNDS.months.max}.`;
  }
  if (!Number.isFinite(fte) || fte < INPUT_BOUNDS.fte.min || fte > INPUT_BOUNDS.fte.max) {
    errors.fte = `Enter FTE between ${INPUT_BOUNDS.fte.min} and ${INPUT_BOUNDS.fte.max}.`;
  }
  if (!Number.isFinite(staffcost) || staffcost <= 0) {
    errors.staffcost = "Enter staff cost greater than zero.";
  }
  if (!TARGET_MARGIN_OPTIONS.includes(targetMarginPercent as (typeof TARGET_MARGIN_OPTIONS)[number])) {
    errors.targetMarginPercent = "Choose a target margin from 10% to 50% in 5% increments.";
  }
  if (typeof raw.scopemove !== "string" || !Object.hasOwn(SCOPE_SHARE, raw.scopemove)) {
    errors.scopemove = "Select a valid scope movement.";
  }
  if (typeof raw.scopebilled !== "string" || !Object.hasOwn(BILLING_MULTIPLIER, raw.scopebilled)) {
    errors.scopebilled = "Select a valid scope billing status.";
  }
  if (typeof raw.hourstracked !== "string" || !Object.hasOwn(BAND_WIDTH, raw.hourstracked)) {
    errors.hourstracked = "Select a valid hours-tracking option.";
  }

  if (Object.keys(errors).length === 0) {
    if (staffcost > fee * INPUT_WARNINGS.staffCostHigh) {
      warnings.push("Check this figure. Staff cost is more than three times the fee.");
    }
    if (staffcost < fee * INPUT_WARNINGS.staffCostLow) {
      warnings.push("Check this figure. Staff cost is under a tenth of the fee.");
    }
    if (fte * months < INPUT_WARNINGS.minPersonMonths) {
      warnings.push("That is less than half a person-month of work. Check the numbers.");
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, warnings };
}
