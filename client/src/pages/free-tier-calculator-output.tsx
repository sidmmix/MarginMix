import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import {
  buildComparisonLine,
  formatPercent,
  formatUsd,
  formatUsdBandHeadline,
  grossMarginNormLabel,
  LEAK_RESULT_STORAGE_KEY,
  SCOPE_BILLED_LABELS,
  SCOPE_MOVE_LABELS,
  staffNormLabel,
  type LeakResult,
} from "@shared/leak-engine";

function confidenceCopy(hours: LeakResult["input"]["hourstracked"]): string {
  if (hours === "no") {
    return "Indicative range. Hours are not tracked on this account, which is why the range is wide.";
  }
  if (hours === "partly") {
    return "Estimate. Hours are partly tracked, so the range is moderate.";
  }
  return "Estimate. Hours are tracked, so the range is tight.";
}

function scopeSubtitle(result: LeakResult): string {
  const move = SCOPE_MOVE_LABELS[result.input.scopemove];
  const billed = SCOPE_BILLED_LABELS[result.input.scopebilled].toLowerCase();
  return `${move}, ${billed}.`;
}

export default function FreeTierCalculatorOutputPage() {
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<LeakResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(LEAK_RESULT_STORAGE_KEY);
    if (!raw) {
      setLocation("/free-tier/calculator");
      return;
    }
    try {
      setResult(JSON.parse(raw) as LeakResult);
    } catch {
      setLocation("/free-tier/calculator");
    }
  }, [setLocation]);

  if (!result) {
    return null;
  }

  const { input } = result;
  const comparison = buildComparisonLine(result.leakpctlow, result.leakpcthigh);
  const fteDisplay = input.fte % 1 === 0 ? String(input.fte) : input.fte.toFixed(1);

  const handleCta = () => {
    analytics.leakCtaClick();
  };

  return (
    <div className="min-h-screen bg-white free-tier-leak-print-root">
      <div className="free-tier-leak-no-print">
        <Header variant="solid" hideDemoButton />
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-24 pb-16 print:pt-6 print:pb-6">
        {/* Block 1 */}
        <header className="mb-8 print:mb-4">
          <h1 className="text-xl font-semibold text-slate-900">Engagement leak analysis</h1>
          <p className="text-slate-600 mt-1">
            Fee {formatUsd(input.fee)} over {input.months} month{input.months === 1 ? "" : "s"}. {fteDisplay} FTE.
          </p>
        </header>

        {/* Block 2 */}
        <section className="mb-8 print:mb-4">
          {result.noLeak ? (
            <p className="text-3xl sm:text-4xl font-bold text-emerald-700">No material leak detected</p>
          ) : (
            <>
              <p className="text-[clamp(1.75rem,8vw,2.75rem)] font-bold text-slate-900 leading-tight break-words">
                {formatUsdBandHeadline(result.leaklow)} to {formatUsdBandHeadline(result.leakhigh)}
              </p>
              <p className="text-slate-700 mt-3 text-base sm:text-lg">
                {formatPercent(result.leakpctlow, 0)} to {formatPercent(result.leakpcthigh, 0)} of fee. Midpoint{" "}
                {formatUsd(result.leakpoint)}, or {formatPercent(result.leakpctmid, 1)}.
              </p>
            </>
          )}
        </section>

        {/* Block 3 */}
        <section className="mb-8 text-slate-700 text-sm sm:text-base print:mb-3">
          <p>{comparison.line}</p>
        </section>

        {/* Block 4 */}
        {!result.noLeak && (
          <section className="mb-8 grid gap-6 sm:grid-cols-2 print:mb-4">
            <div
              className={`rounded-xl border p-4 ${result.driver === "delivery" ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200"}`}
            >
              <h2 className="font-semibold text-slate-900">Delivery leak</h2>
              <p className="text-2xl font-bold mt-1">{formatUsd(result.deliveryleak)}</p>
              <p className="text-sm text-slate-600 mt-2">
                Staff cost is {formatPercent(result.staffsharepct, 0)} of fee. The norm is {staffNormLabel()} (industry
                benchmark), leaving {grossMarginNormLabel()} gross margin (benchmark).
              </p>
              {result.deliverycapped && (
                <p className="text-sm text-amber-800 mt-2 font-medium">
                  Delivery leak is capped at 30% of fee. Check the staff cost figure.
                </p>
              )}
              {result.driver === "delivery" && (
                <p className="text-sm font-medium text-emerald-800 mt-2">This is the driver.</p>
              )}
            </div>

            {!result.hideScopeBlock && (
              <div
                className={`rounded-xl border p-4 ${result.driver === "scope" ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200"}`}
              >
                <h2 className="font-semibold text-slate-900">Scope leak</h2>
                <p className="text-2xl font-bold mt-1">{formatUsd(result.scopeleak)}</p>
                <p className="text-sm text-slate-600 mt-2 capitalize">{scopeSubtitle(result)}</p>
                {result.driver === "scope" && (
                  <p className="text-sm font-medium text-emerald-800 mt-2">This is the driver.</p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Block 5 */}
        {!result.noLeak && (
          <section className="mb-6">
            <p className="text-slate-800">
              <span className="font-semibold">What this means:</span> {result.cause}.
            </p>
          </section>
        )}

        {/* Block 6 */}
        {result.feeshortfall > 0 && (
          <section className="mb-6 text-slate-700">
            <p>
              To hold a normal gross margin this account needed {formatUsd(result.requiredfee)}. It was sold at{" "}
              {formatUsd(input.fee)}, which is {formatUsd(result.feeshortfall)} light.
            </p>
          </section>
        )}

        {/* Block 7 */}
        {!result.noLeak && (
          <section className="mb-6 text-slate-600 text-sm">{confidenceCopy(input.hourstracked)}</section>
        )}

        {/* Block 8 */}
        <section className="mb-8 text-slate-600 text-sm print:mb-4">
          This range assumes a standard team mix. MarginMix narrows it to a single figure when you add the seniority mix
          on the account, which is usually the difference between an estimate and an accurate number.
        </section>

        {/* Block 9 */}
        <section className="free-tier-leak-no-print space-y-3">
          <Link href="/assessment">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
              onClick={handleCta}
            >
              Narrow this to one number
            </Button>
          </Link>
          <p className="text-sm text-slate-600 max-w-xl">
            Need it defensible? The paid audit runs the same arithmetic on your SOW, timesheet export and rate card and
            returns figures your finance team can check line by line.
          </p>
          <Link href="/free-tier/calculator" className="text-sm text-emerald-700 hover:underline inline-block">
            Run another engagement
          </Link>
        </section>
      </main>
    </div>
  );
}
