import { INDUSTRY_LEAK_HIGH, INDUSTRY_LEAK_LOW } from "./constants";
import { formatPercentRange } from "./format";

export interface ComparisonLineResult {
  nearNormal: boolean;
  line: string;
}

/**
 * Industry benchmark comparison copy. Uses leak_pct_low vs INDUSTRY_LEAK_HIGH
 * for the low multiple and leak_pct_high vs INDUSTRY_LEAK_LOW for the high multiple.
 */
export function buildComparisonLine(
  leakpctlow: number,
  leakpcthigh: number,
): ComparisonLineResult {
  const lowMultiple = leakpctlow / INDUSTRY_LEAK_HIGH;
  const highMultiple = leakpcthigh / INDUSTRY_LEAK_LOW;

  if (lowMultiple < 1.5) {
    return {
      nearNormal: true,
      line: "This account sits near the normal range.",
    };
  }

  const lowStr = lowMultiple.toFixed(1);
  const highStr = highMultiple.toFixed(1);
  const industryRange = formatPercentRange(INDUSTRY_LEAK_LOW, INDUSTRY_LEAK_HIGH, 0);

  return {
    nearNormal: false,
    line: `Typical revenue leakage for services firms is ${industryRange} (industry benchmark). This account is ${lowStr} to ${highStr} times that range.`,
  };
}
