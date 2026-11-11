import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { analytics } from "@/lib/analytics";
import {
  formatPercent,
  formatUsd,
  formatUsdBandHeadline,
  LEAK_RESULT_STORAGE_KEY,
  SCOPE_SHARE,
  SCOPE_BILLED_LABELS,
  SCOPE_MOVE_LABELS,
  DEFAULT_TARGET_MARGIN_PERCENT,
  readStoredLeakResult,
  validateLeakInput,
  type LeakResult,
} from "@shared/leak-engine";
import { BILLING_MULTIPLIER } from "@shared/leak-engine";

function confidenceCopy(hours: LeakResult["input"]["hourstracked"]): string {
  if (hours === "no") {
    return "The range uses a ±30% sensitivity band because hours are not tracked. It is not a statistical confidence interval.";
  }
  if (hours === "partly") {
    return "The range uses a ±20% sensitivity band because hours are partly tracked. It is not a statistical confidence interval.";
  }
  return "The range uses a ±12% sensitivity band because hours are tracked. It is not a statistical confidence interval.";
}

function scopeSubtitle(result: LeakResult): string {
  const move = SCOPE_MOVE_LABELS[result.input.scopemove];
  const billed = SCOPE_BILLED_LABELS[result.input.scopebilled].toLowerCase();
  return `${move}, ${billed}.`;
}

function scopeAssumptionCopy(result: LeakResult): string {
  const band = SCOPE_SHARE[result.input.scopemove];
  const billingFactor = BILLING_MULTIPLIER[result.input.scopebilled];
  const adjustedLow = band.low * billingFactor;
  const adjustedHigh = band.high * billingFactor;
  return `${SCOPE_MOVE_LABELS[result.input.scopemove]} uses a preset ${(band.low * 100).toFixed(0)}–${(band.high * 100).toFixed(0)}% period-fee band and a ${Math.round(billingFactor * 100)}% billing factor. The estimate uses the midpoint; its underlying assumption spans ${(adjustedLow * 100).toFixed(1)}–${(adjustedHigh * 100).toFixed(1)}% of fee before any overlap with delivery exposure. These are assumptions, not measured unbilled work.`;
}

export default function FreeTierCalculatorOutputPage() {
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<LeakResult | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    const savedResult = readStoredLeakResult(sessionStorage.getItem(LEAK_RESULT_STORAGE_KEY));
    if (!savedResult) {
      setLocation("/free-tier/calculator");
      return;
    }
    setResult(savedResult);
  }, [setLocation]);

  if (!result) {
    return null;
  }

  const { input } = result;
  const targetMarginPercent = input.targetMarginPercent ?? DEFAULT_TARGET_MARGIN_PERCENT;
  const warnings = validateLeakInput(input).warnings;
  const fteDisplay = input.fte % 1 === 0 ? String(input.fte) : input.fte.toFixed(1);

  const handleCta = () => {
    analytics.leakCtaClick();
    setReviewSubmitted(false);
    setReviewError("");
    setReviewOpen(true);
  };

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!result || reviewSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      companyName: String(formData.get("companyName") ?? "").trim(),
      engagement: {
        fee: input.fee,
        months: input.months,
        fte: input.fte,
        staffcost: input.staffcost,
        targetMarginPercent,
        exposureLow: result.leaklow,
        exposureHigh: result.leakhigh,
      },
    };

    setReviewSubmitting(true);
    setReviewError("");
    try {
      const response = await fetch("/api/leak-review-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const responseBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseBody.message || "Unable to send your request right now. Please try again.");
      }
      setReviewSubmitted(true);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to send your request right now. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
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
            <>
              <p className="text-3xl sm:text-4xl font-bold text-emerald-700">No material modelled exposure detected</p>
              <p className="text-slate-700 mt-3">Combined exposure indicator: {formatUsd(result.leakpoint)}. Indicative exposure range: {formatUsd(result.leaklow)} to {formatUsd(result.leakhigh)}.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Indicative exposure range</p>
              <p className="text-[clamp(1.75rem,8vw,2.75rem)] font-bold text-slate-900 leading-tight break-words">
                {formatUsdBandHeadline(result.leaklow)} to {formatUsdBandHeadline(result.leakhigh)}
              </p>
              <p className="text-slate-700 mt-3 text-base sm:text-lg">
                {formatPercent(result.leakpctlow, 0)} to {formatPercent(result.leakpcthigh, 0)} of fee. Combined exposure indicator:{" "}
                {formatUsd(result.leakpoint)}, or {formatPercent(result.leakpctmid, 1)}.
              </p>
            </>
          )}
        </section>

        {warnings.length > 0 && (
          <section aria-label="Check your inputs" role="alert" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <h2 className="font-semibold mb-2">Check your inputs</h2>
            {warnings.map(warning => <p key={warning}>{warning}</p>)}
          </section>
        )}

        {/* Block 4 */}
          <section className="mb-8 grid gap-6 sm:grid-cols-2 print:mb-4">
            <div
              className={`rounded-xl border p-4 ${result.driver === "delivery" ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200"}`}
            >
              <h2 className="font-semibold text-slate-900">Estimated delivery-cost exposure</h2>
              <p className="text-2xl font-bold mt-1">{formatUsd(result.deliveryleak)}</p>
              <p className="text-sm text-slate-600 mt-2">
                Staff cost is {formatPercent(result.staffsharepct, 0)} of fee. Your selected target is {targetMarginPercent}% after staff costs, which sets a {100 - targetMarginPercent}% staff-cost ceiling.
              </p>
              {result.deliverycapped && (
                <p className="text-sm text-amber-800 mt-2 font-medium">
                  Delivery-cost exposure is capped at 30% of fee. Check the staff cost figure.
                </p>
              )}
              {!result.noLeak && result.driver === "delivery" && (
                <p className="text-sm font-medium text-emerald-800 mt-2">This is the driver.</p>
              )}
            </div>

              <div
                className={`rounded-xl border p-4 ${result.driver === "scope" ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200"}`}
              >
                <h2 className="font-semibold text-slate-900">Estimated scope exposure</h2>
                <p className="text-2xl font-bold mt-1">{formatUsd(result.scopeleak)}</p>
                <p className="text-sm text-slate-600 mt-2 capitalize">{scopeSubtitle(result)}</p>
                {!result.noLeak && result.driver === "scope" && (
                  <p className="text-sm font-medium text-emerald-800 mt-2">This is the driver.</p>
                )}
              </div>
          </section>

        {/* Block 5 */}
        {!result.noLeak && (
          <section className="mb-6">
            <p className="text-slate-800">
              <span className="font-semibold">What this means:</span> {result.cause}.
            </p>
          </section>
        )}

        {/* Block 6 */}
        <section className="mb-6 text-slate-700">
          {result.feeshortfall > 0 ? (
            <p>
              At the selected {targetMarginPercent}% target after staff costs, the model estimates a required fee of {formatUsd(result.requiredfee)}. It was sold at{" "}
              {formatUsd(input.fee)}, an estimated fee uplift of {formatUsd(result.feeshortfall)}.
            </p>
          ) : (
            <p>
              At the selected {targetMarginPercent}% target after staff costs, the current fee meets the modelled target.
              Estimated fee uplift: {formatUsd(0)}.
            </p>
          )}
        </section>

        <section className="mb-8 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 print:mb-4">
          <h2 className="font-semibold text-slate-900">How to interpret this estimate</h2>
            <p>
              The combined exposure indicator is the larger of the delivery and scope estimates plus half the smaller.
              These components can overlap, so this is not their additive total, verified loss, or recovered revenue.
            </p>
          <p>{confidenceCopy(input.hourstracked)}</p>
          <p>{scopeAssumptionCopy(result)}</p>
          <p>
            This is a rule-based planning estimate, not an audited result. It uses staff costs and does not include other
            non-labour direct costs. Fee and staff cost cover the same entered period; months and FTE provide context
            and do not multiply these amounts. Delivery exposure is capped at 30% of fee. These assumptions have not been
            calibrated against actual engagement outcomes.
          </p>
        </section>

        {/* Block 9 */}
        <section className="free-tier-leak-no-print space-y-3">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            onClick={handleCta}
          >
            Review this engagement
          </Button>
          <p className="text-sm text-slate-600 max-w-xl">
            Bring your SOW, timesheet export and rate card to a fuller review of these assumptions.
            This indicative calculator is not a substitute for checking the underlying records.
          </p>
          <Link href="/free-tier/calculator" className="text-sm text-emerald-700 hover:underline inline-block">
            Run another engagement
          </Link>
        </section>
      </main>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-lg">
          {reviewSubmitted ? (
            <DialogHeader>
              <DialogTitle className="text-2xl text-emerald-700">Request submitted</DialogTitle>
              <DialogDescription className="pt-2">
                Your request and engagement summary have been emailed to you and Sid at MarginMix.
              </DialogDescription>
              <Button type="button" className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => setReviewOpen(false)}>
                Close
              </Button>
            </DialogHeader>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6 text-xl leading-snug">
                  Register Interest for a Detailed Review of Concerned Engagement/Account
                </DialogTitle>
                <DialogDescription>
                  Enter your contact details. We’ll send your request and this engagement’s calculator summary to you and Sid.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="review-full-name">Full Name</Label>
                  <Input id="review-full-name" name="name" autoComplete="name" required maxLength={200} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-email">Email</Label>
                  <Input id="review-email" name="email" type="email" autoComplete="email" required maxLength={320} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-company">Company Name</Label>
                  <Input id="review-company" name="companyName" autoComplete="organization" required maxLength={200} />
                </div>
                {reviewError && <p role="alert" className="text-sm text-red-600">{reviewError}</p>}
                <Button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {reviewSubmitting ? "Sending..." : "Submit"}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
