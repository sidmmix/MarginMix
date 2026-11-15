import {
  formatCurrency,
  SCOPE_BILLED_LABELS,
  SCOPE_MOVE_LABELS,
  type LeakCurrency,
  type ScopeBilled,
  type ScopeMove,
  type HoursTracked,
} from "../shared/leak-engine";
import {
  leakEstimateMethodologyCopy,
  leakEstimateSensitivityCopy,
} from "../shared/leak-engine/methodology-copy";

export type LeakReviewEngagementSummary = {
  currency: LeakCurrency;
  fee: number;
  months: number;
  fte: number;
  staffcost: number;
  targetMarginPercent: number;
  exposureLow: number;
  exposureHigh: number;
  scopemove: ScopeMove;
  scopebilled: ScopeBilled;
  hourstracked: HoursTracked;
};

function escapeHtml(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function buildLeakReviewEngagementRows(
  engagement: LeakReviewEngagementSummary,
): string {
  const amount = (value: number) =>
    escapeHtml(formatCurrency(value, engagement.currency, { decimals: 2 }));
  const hoursTrackedLabel = {
    yes: "Tracked",
    partly: "Partly tracked",
    no: "Not tracked",
  }[engagement.hourstracked];

  return `
    <p><strong>Fee for entered period:</strong> ${amount(engagement.fee)}</p>
    <p><strong>Period:</strong> ${escapeHtml(engagement.months)} months</p>
    <p><strong>Team size:</strong> ${escapeHtml(engagement.fte)} FTE</p>
    <p><strong>Staff cost for entered period:</strong> ${amount(engagement.staffcost)}</p>
    <p><strong>Target margin:</strong> ${escapeHtml(engagement.targetMarginPercent)}%</p>
    <p><strong>Indicative exposure range:</strong> ${amount(engagement.exposureLow)} to ${amount(engagement.exposureHigh)}</p>
    <p><strong>Scope movement:</strong> ${escapeHtml(SCOPE_MOVE_LABELS[engagement.scopemove])}</p>
    <p><strong>Scope billing status:</strong> ${escapeHtml(SCOPE_BILLED_LABELS[engagement.scopebilled])}</p>
    <p><strong>Hours tracking:</strong> ${escapeHtml(hoursTrackedLabel)}</p>
    <h3>Estimate assumptions</h3>
    <p>${escapeHtml(leakEstimateMethodologyCopy.model)}</p>
    <p>${escapeHtml(leakEstimateMethodologyCopy.scope)}</p>
    <p>${escapeHtml(leakEstimateMethodologyCopy.combined)}</p>
    <p>${escapeHtml(leakEstimateSensitivityCopy(engagement.hourstracked))}</p>
    <p>${escapeHtml(leakEstimateMethodologyCopy.limits)}</p>
  `;
}
