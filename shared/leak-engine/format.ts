import { GROSS_MARGIN_NORM, STAFFCOST_NORM } from "./constants";

export function formatUsd(amount: number, options?: { decimals?: number }): string {
  const decimals = options?.decimals ?? 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/** Headline band: round to nearest $1,000 for display (acceptance). */
export function formatUsdBandHeadline(amount: number): string {
  const rounded = Math.round(amount / 1000) * 1000;
  return formatUsd(rounded);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatPercentRange(low: number, high: number, decimals = 0): string {
  return `${formatPercent(low, decimals)} to ${formatPercent(high, decimals)}`;
}

export function staffNormLabel(): string {
  return `${Math.round(STAFFCOST_NORM * 100)}%`;
}

export function grossMarginNormLabel(): string {
  return `${Math.round(GROSS_MARGIN_NORM * 100)}%`;
}
