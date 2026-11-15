import {
  LEAK_RESULT_STORAGE_KEY,
  readStoredLeakResult,
  type LeakResult,
} from "@shared/leak-engine";

export const LEAK_ESTIMATES_STORAGE_KEY = "marginmix_free_tier_leak_estimates";

export type LeakEstimate = {
  label: string;
  result: LeakResult;
};

export function readStoredLeakEstimates(raw: string | null): LeakEstimate[] {
  if (!raw) return [];

  try {
    const stored: unknown = JSON.parse(raw);
    if (!Array.isArray(stored)) return [];

    return stored.flatMap((entry, index) => {
      if (!entry || typeof entry !== "object") return [];
      const candidate = entry as { label?: unknown; result?: unknown };
      if (candidate.result === undefined) return [];
      const result = readStoredLeakResult(JSON.stringify(candidate.result));
      if (!result) return [];

      const label =
        typeof candidate.label === "string" && candidate.label.trim()
          ? candidate.label.trim().slice(0, 80)
          : `Engagement ${index + 1}`;

      return [{ label, result }];
    });
  } catch {
    return [];
  }
}

export function getSessionLeakEstimates(): LeakEstimate[] {
  const estimates = readStoredLeakEstimates(
    sessionStorage.getItem(LEAK_ESTIMATES_STORAGE_KEY),
  );
  if (estimates.length > 0) return estimates;

  const previousResult = readStoredLeakResult(
    sessionStorage.getItem(LEAK_RESULT_STORAGE_KEY),
  );
  return previousResult
    ? [{ label: "Engagement 1", result: previousResult }]
    : [];
}
