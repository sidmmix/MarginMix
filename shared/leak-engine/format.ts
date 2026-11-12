import { DEFAULT_CURRENCY, type LeakCurrency } from "./constants";

type CurrencyFormatOptions = { decimals?: number };

function formatAmount(
  amount: number,
  currency: LeakCurrency,
  options: CurrencyFormatOptions | undefined,
  currencyDisplay: "code" | "symbol",
): string {
  const decimals = options?.decimals ?? 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/** Uses the ISO currency code to keep all three supported denominations unambiguous. */
export function formatCurrency(
  amount: number,
  currency: LeakCurrency = DEFAULT_CURRENCY,
  options?: CurrencyFormatOptions,
): string {
  return formatAmount(amount, currency, options, "code");
}

export function formatUsd(amount: number, options?: CurrencyFormatOptions): string {
  return formatAmount(amount, "USD", options, "symbol");
}

/** Headline band: round to the nearest 1,000 units of the selected currency. */
export function formatCurrencyBandHeadline(amount: number, currency: LeakCurrency = DEFAULT_CURRENCY): string {
  const rounded = Math.round(amount / 1000) * 1000;
  return formatCurrency(rounded, currency);
}

/** USD compatibility formatter retained for existing callers and tests. */
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
