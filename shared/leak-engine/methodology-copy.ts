import {
  BAND_WIDTH,
  BILLING_MULTIPLIER,
  MAX_DELIVERY_LEAK,
  SCOPE_SHARE,
} from "./constants";
import type { HoursTracked } from "./constants";

const percent = (value: number) => `${(value * 100).toFixed(0)}%`;
const sensitivityPercent = (hours: HoursTracked) =>
  `±${percent(BAND_WIDTH[hours])}`;

const scopePresets = Object.entries(SCOPE_SHARE)
  .map(([name, band]) => `${name} ${percent(band.low)}–${percent(band.high)}`)
  .join(", ");

const billingAdjustments = Object.entries(BILLING_MULTIPLIER)
  .map(([status, factor]) => `${status.replace("_", " ")} ${percent(factor)}`)
  .join(", ");

export const leakEstimateMethodologyCopy = {
  model:
    `Delivery cost exposure uses staff costs against the selected target margin and is capped at ${percent(MAX_DELIVERY_LEAK)} of the period fee.`,
  scope:
    `Scope exposure uses preset ranges as a share of the period fee (${scopePresets}), adjusted by billing status (${billingAdjustments}).`,
  combined:
    "The combined exposure indicator is the larger of the delivery and scope estimates plus half the smaller to account for possible overlap.",
  range:
    `The sensitivity range reflects hours tracking: tracked ${sensitivityPercent("yes")}, partly tracked ${sensitivityPercent("partly")}, and not tracked ${sensitivityPercent("no")}. It is a sensitivity band, not a statistical confidence interval.`,
  period:
    "Fee and staff cost cover the same entered period. Months and FTE provide context only and do not multiply these amounts.",
  limits:
    "This is a planning estimate, not audited loss or recovered revenue. It excludes other non-labour direct costs and has not been calibrated against actual engagement outcomes.",
} as const;

export function leakEstimateSensitivityCopy(hours: HoursTracked): string {
  const tracking = {
    yes: "tracked",
    partly: "partly tracked",
    no: "not tracked",
  }[hours];
  return `The range uses ${sensitivityPercent(hours)} because hours are ${tracking}. ${leakEstimateMethodologyCopy.range}`;
}
