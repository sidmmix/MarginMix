import React, { useId } from "react";
import {
  BAND_WIDTH,
  BILLING_MULTIPLIER,
  DEFAULT_CURRENCY,
  DEFAULT_TARGET_MARGIN_PERCENT,
  SCOPE_MOVE_LABELS,
  SCOPE_SHARE,
  SCOPE_BILLED_LABELS,
  formatCurrency,
  formatCurrencyBandHeadline,
  type LeakResult,
} from "@shared/leak-engine";

type LeakEstimateComparisonProps = {
  estimates: Array<{ label: string; result: LeakResult }>;
};

const hoursTrackedLabels: Record<LeakResult["input"]["hourstracked"], string> = {
  yes: "Yes",
  partly: "Partly",
  no: "No",
};

function formatFte(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function EstimateCard({
  label,
  result,
}: {
  label: string;
  result: LeakResult;
}) {
  const headingId = useId();
  const { input } = result;
  const currency = input.currency ?? DEFAULT_CURRENCY;
  const targetMargin = input.targetMarginPercent ?? DEFAULT_TARGET_MARGIN_PERCENT;
  const scopeBand = SCOPE_SHARE[input.scopemove];
  const billingFactor = BILLING_MULTIPLIER[input.scopebilled];
  const scopeAssumptionLow = scopeBand.low * billingFactor * 100;
  const scopeAssumptionHigh = scopeBand.high * billingFactor * 100;
  const bandWidth = BAND_WIDTH[input.hourstracked] * 100;

  const assumptions = [
    ["Period fee", formatCurrency(input.fee, currency)],
    ["Duration", `${input.months} month${input.months === 1 ? "" : "s"}`],
    ["Account allocation", `${formatFte(input.fte)} FTE`],
    ["Staff costs", formatCurrency(input.staffcost, currency)],
    ["Target margin", `${targetMargin}% after staff costs`],
    ["Scope movement", SCOPE_MOVE_LABELS[input.scopemove]],
    ["Unplanned scope billing", SCOPE_BILLED_LABELS[input.scopebilled]],
    ["Hours tracked", hoursTrackedLabels[input.hourstracked]],
  ];

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-[#d7e4d9] bg-[#fffefa] shadow-[0_8px_28px_rgba(24,59,55,0.06)]">
      <header className="border-b border-[#e3ebe2] bg-[#f3f7f0] px-5 py-5 sm:px-6">
        <p className="mb-2 inline-flex rounded-full border border-[#c6dccb] bg-[#e8f1e7] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#28644f]">
          Indicative estimate
        </p>
        <h3 className="break-words text-xl font-bold leading-tight text-[#183b37] sm:text-2xl">
          {label}
        </h3>
      </header>

      <div className="p-5 sm:p-6">
        <section
          aria-label={`${label} estimated exposure range`}
          className="mb-6 rounded-xl border border-[#dbe8dc] bg-[#edf4eb] p-4 sm:p-5"
        >
          {result.noLeak ? (
            <>
              <p className="text-lg font-bold leading-snug text-[#146d58] sm:text-xl">
                No material modelled exposure
              </p>
              <p className="mt-2 text-sm leading-6 text-[#45635a]">
                Indicative range:{" "}
                <span className="font-semibold text-[#183b37]">
                  {formatCurrencyBandHeadline(result.leaklow, currency)} to{" "}
                  {formatCurrencyBandHeadline(result.leakhigh, currency)}
                </span>
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#5f8074]">
                Estimated exposure range
              </p>
              <p className="mt-2 break-words text-[clamp(1.45rem,5vw,2.15rem)] font-extrabold leading-tight tracking-tight text-[#183b37]">
                {formatCurrencyBandHeadline(result.leaklow, currency)} to{" "}
                {formatCurrencyBandHeadline(result.leakhigh, currency)}
              </p>
            </>
          )}
          <p className="mt-3 border-t border-[#d8e5d9] pt-3 text-xs leading-5 text-[#60776f]">
            Planning estimate only. It is not an audited loss, actual recovered
            revenue, or a persistent saving.
          </p>
        </section>

        <section aria-labelledby={`${headingId}-exposure`} className="mb-6">
          <h4
            id={`${headingId}-exposure`}
            className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#60776f]"
          >
            Exposure components
          </h4>
          <dl className="divide-y divide-[#e7ece5] rounded-xl border border-[#e2e9e1] px-4">
            <div className="flex items-baseline justify-between gap-3 py-3">
              <dt className="text-sm text-[#45635a]">Delivery-cost exposure</dt>
              <dd className="shrink-0 text-right font-semibold tabular-nums text-[#183b37]">
                {formatCurrency(result.deliveryleak, currency)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-3">
              <dt className="text-sm text-[#45635a]">Scope exposure</dt>
              <dd className="shrink-0 text-right font-semibold tabular-nums text-[#183b37]">
                {formatCurrency(result.scopeleak, currency)}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby={`${headingId}-inputs`}>
          <h4
            id={`${headingId}-inputs`}
            className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#60776f]"
          >
            Inputs and assumptions
          </h4>
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2.5 text-sm">
            {assumptions.map(([term, value]) => (
              <div key={term} className="contents">
                <dt className="min-w-0 text-[#60776f]">{term}</dt>
                <dd className="max-w-[58%] text-right font-medium text-[#294c45]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 space-y-2 border-t border-[#e7ece5] pt-4 text-xs leading-5 text-[#60776f]">
            <p>
              Delivery-cost exposure compares staff costs with the{" "}
              {100 - targetMargin}% of-fee ceiling implied by the {targetMargin}%
              target margin, and is capped at 30% of the period fee.
            </p>
            <p>
              Scope assumption: {SCOPE_MOVE_LABELS[input.scopemove].toLowerCase()} uses{" "}
              {(scopeBand.low * 100).toFixed(0)}–{(scopeBand.high * 100).toFixed(0)}%
              of the period fee, adjusted by a{" "}
              {Math.round(billingFactor * 100)}% billing factor. That is{" "}
              {scopeAssumptionLow.toFixed(1)}–{scopeAssumptionHigh.toFixed(1)}%
              of fee before possible overlap with delivery exposure; it is not
              measured unbilled work.
            </p>
            <p>
              Hours tracking is {hoursTrackedLabels[input.hourstracked].toLowerCase()}.
              The estimate band uses a ±{bandWidth.toFixed(0)}% sensitivity
              assumption for tracking quality.
            </p>
            <p>
              The combined indicator uses the larger component plus half the
              smaller to account for possible overlap. It is not an additive total.
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}

export default function LeakEstimateComparison({
  estimates,
}: LeakEstimateComparisonProps) {
  if (estimates.length === 0) {
    return (
      <section
        aria-label="Engagement estimate comparison"
        className="rounded-2xl border border-dashed border-[#cdddcf] bg-[#f3f7f0] px-5 py-8 text-center"
      >
        <h2 className="text-lg font-semibold text-[#294c45]">
          No estimates to compare yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#60776f]">
          Add engagement estimates to review their ranges, exposure components,
          and underlying assumptions side by side.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Engagement estimate comparison"
      className="space-y-4"
    >
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#5f8074]">
          Compare engagements
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-[#183b37] sm:text-2xl">
          Planning estimates, side by side
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#60776f]">
          Compare the selected inputs and model assumptions. Component figures
          may overlap and should not be treated as verified losses or additive
          totals.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {estimates.map(({ label, result }, index) => (
          <EstimateCard
            key={`${label}-${index}`}
            label={label}
            result={result}
          />
        ))}
      </div>
    </section>
  );
}
