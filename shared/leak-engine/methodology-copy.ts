export const leakEstimateMethodologyCopy = {
  model:
    "Delivery cost exposure uses staff costs against the selected target margin and is capped at 30% of the period fee. Scope exposure uses preset assumptions adjusted for billing status.",
  combined:
    "The combined exposure indicator is the larger of the delivery and scope estimates plus half the smaller to account for possible overlap.",
  range:
    "The range reflects the hours tracking category. It is a sensitivity band, not a statistical confidence interval.",
  period:
    "Fee and staff cost cover the same entered period. Months and FTE provide context only and do not multiply these amounts.",
  limits:
    "This is a planning estimate, not audited loss or recovered revenue. It excludes other non-labour direct costs and has not been calibrated against actual engagement outcomes.",
} as const;
