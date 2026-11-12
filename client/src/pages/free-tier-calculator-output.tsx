import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/header";
import { BrandName } from "@/components/brand-name";
import { Footer } from "@/components/footer";
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
import { ChevronDown } from "lucide-react";
import {
  formatPercent,
  formatCurrency,
  formatCurrencyBandHeadline,
  LEAK_RESULT_STORAGE_KEY,
  SCOPE_SHARE,
  SCOPE_BILLED_LABELS,
  SCOPE_MOVE_LABELS,
  DEFAULT_TARGET_MARGIN_PERCENT,
  DEFAULT_CURRENCY,
  readStoredLeakResult,
  validateLeakInput,
  type LeakResult,
} from "@shared/leak-engine";
import { BILLING_MULTIPLIER } from "@shared/leak-engine";

type TurnstileOptions = {
  sitekey: string;
  action: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

function TurnstileCheck({
  siteKey,
  onToken,
  onError,
  resetSignal,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  onError: (message: string) => void;
  resetSignal: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const scriptUrl = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    let script = document.querySelector<HTMLScriptElement>('script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]');

    const renderWidget = () => {
      if (!mounted || !window.turnstile || !containerRef.current || widgetIdRef.current) return;
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action: "leak_review_interest",
          callback: (token) => {
            onError("");
            onToken(token);
          },
          "expired-callback": () => {
            onToken("");
            onError("The security check expired. Please complete it again.");
          },
          "error-callback": () => {
            onToken("");
            onError("The security check could not be completed. Please try again.");
          },
        });
      } catch {
        onError("The security check could not be loaded. Please refresh and try again.");
      }
    };
    const handleScriptError = () => onError("The security check could not be loaded. Please refresh and try again.");

    if (window.turnstile) {
      renderWidget();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderWidget);
      script.addEventListener("error", handleScriptError);
    }

    return () => {
      mounted = false;
      script?.removeEventListener("load", renderWidget);
      script?.removeEventListener("error", handleScriptError);
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
      onToken("");
    };
  }, [siteKey, onToken, onError]);

  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      onToken("");
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetSignal, onToken]);

  return <div ref={containerRef} aria-label="Cloudflare Turnstile security check" />;
}

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
  const [showMethodology, setShowMethodology] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const turnstileHostAllowed = typeof window !== "undefined" && window.location.hostname === "marginmix.ai";
  const turnstileSiteKey = turnstileHostAllowed ? import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "" : "";

  const handleTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);
  const handleTurnstileError = useCallback((message: string) => setTurnstileError(message), []);

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
  const currency = input.currency ?? DEFAULT_CURRENCY;
  const targetMarginPercent = input.targetMarginPercent ?? DEFAULT_TARGET_MARGIN_PERCENT;
  const warnings = validateLeakInput(input).warnings;
  const fteDisplay = input.fte % 1 === 0 ? String(input.fte) : input.fte.toFixed(1);

  const handleCta = () => {
    analytics.leakCtaClick();
    setReviewSubmitted(false);
    setReviewError("");
    setTurnstileToken("");
    setTurnstileError("");
    setReviewOpen(true);
  };

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!result || reviewSubmitting) return;
    if (!turnstileToken) {
      setReviewError("Complete the security check before submitting.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      companyName: String(formData.get("companyName") ?? "").trim(),
      turnstileToken,
      engagement: {
        currency: input.currency ?? DEFAULT_CURRENCY,
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
      setTurnstileToken("");
      setTurnstileResetSignal((current) => current + 1);
    }
  };

  return (
    <div className="mm-page min-h-screen free-tier-leak-print-root mm-results">
      <div className="free-tier-leak-no-print">
        <Header notice="Your calculator inputs and results remain in this browser session and are not saved to MarginMix’s database." />
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-16 print:pt-6 print:pb-6 sm:px-6">
        {/* Block 1 */}
        <header className="mb-8 print:mb-4">
          <p className="mm-eyebrow mb-2">Your engagement snapshot</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#183b37] sm:text-4xl">Engagement leak analysis</h1>
          <p className="text-[#60776f] mt-2">
            Fee {formatCurrency(input.fee, currency)} over {input.months} month{input.months === 1 ? "" : "s"}. {fteDisplay} FTE.
          </p>
        </header>

        {/* Block 2 */}
        <section className="mm-result-hero mb-8 print:mb-4">
          {result.noLeak ? (
            <>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#146d58]">No material modelled exposure detected</p>
              <p className="text-[#45635a] mt-3">Combined exposure indicator: {formatCurrency(result.leakpoint, currency)}. Indicative exposure range: {formatCurrency(result.leaklow, currency)} to {formatCurrency(result.leakhigh, currency)}.</p>
            </>
          ) : (
            <>
              <p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#5f8074]">Indicative exposure range</p>
              <p className="mm-number text-[clamp(1.9rem,8vw,4rem)] font-extrabold text-[#183b37] leading-tight break-words">
                {formatCurrencyBandHeadline(result.leaklow, currency)} to {formatCurrencyBandHeadline(result.leakhigh, currency)}
              </p>
              <p className="text-[#45635a] mt-3 text-base sm:text-lg">
                {formatPercent(result.leakpctlow, 0)} to {formatPercent(result.leakpcthigh, 0)} of fee. Combined exposure indicator:{" "}
                {formatCurrency(result.leakpoint, currency)}, or {formatPercent(result.leakpctmid, 1)}.
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
          <section className="mm-result-grid mb-8 grid gap-4 sm:grid-cols-2 print:mb-4">
            <div
                className={`rounded-2xl border p-5 ${result.driver === "delivery" ? "border-[#79b39b] bg-[#eaf3e9]" : "border-[#dce5dc] bg-[#fffefa]"}`}
            >
              <h2 className="font-semibold text-[#294c45]">Estimated delivery-cost exposure</h2>
              <p className="mm-number text-3xl font-extrabold text-[#183b37] mt-1">{formatCurrency(result.deliveryleak, currency)}</p>
              <p className="text-sm text-[#60776f] mt-2">
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
                className={`rounded-2xl border p-5 ${result.driver === "scope" ? "border-[#79b39b] bg-[#eaf3e9]" : "border-[#dce5dc] bg-[#fffefa]"}`}
              >
                <h2 className="font-semibold text-[#294c45]">Estimated scope exposure</h2>
                <p className="mm-number text-3xl font-extrabold text-[#183b37] mt-1">{formatCurrency(result.scopeleak, currency)}</p>
                <p className="text-sm text-[#60776f] mt-2 capitalize">{scopeSubtitle(result)}</p>
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
              At the selected {targetMarginPercent}% target after staff costs, the model estimates a required fee of {formatCurrency(result.requiredfee, currency)}. It was sold at{" "}
              {formatCurrency(input.fee, currency)}, an estimated fee uplift of {formatCurrency(result.feeshortfall, currency)}.
            </p>
          ) : (
            <p>
              At the selected {targetMarginPercent}% target after staff costs, the current fee meets the modelled target.
              Estimated fee uplift: {formatCurrency(0, currency)}.
            </p>
          )}
        </section>

        <section className="mm-explain mb-8 space-y-3 rounded-2xl border border-[#dce5dc] bg-[#eaf0e8] p-5 text-sm text-[#45635a] print:mb-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Estimate assumptions and method</h2>
            <Button
              type="button"
              variant="ghost"
              aria-expanded={showMethodology}
              aria-controls="leak-estimate-methodology"
              onClick={() => setShowMethodology((open) => !open)}
              className="free-tier-leak-no-print shrink-0 text-[#146d58] hover:bg-[#dce9d7]"
            >
              {showMethodology ? "Hide details" : "How this estimate works"}
              <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showMethodology ? "rotate-180" : ""}`} />
            </Button>
          </div>
          <div
            id="leak-estimate-methodology"
            className={`free-tier-leak-methodology-content space-y-3 ${showMethodology ? "" : "hidden"}`}
          >
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
          </div>
        </section>

        {/* Block 9 */}
        <section className="free-tier-leak-no-print space-y-3">
            <Button
            size="lg"
            className="mm-action w-full sm:w-auto bg-[#146d58] hover:bg-[#0c5747]"
            onClick={handleCta}
          >
            Review this engagement
          </Button>
          <p className="text-sm text-[#60776f] max-w-xl">
            Bring your SOW, timesheet export and rate card to a fuller review of these assumptions.
            This indicative calculator is not a substitute for checking the underlying records.
          </p>
          <Link href="/free-tier/calculator" className="text-sm font-semibold text-[#146d58] hover:underline inline-block">
            Run another engagement
          </Link>
        </section>
      </main>
      <Footer notice="Your calculator inputs and results remain in this browser session and are not saved to MarginMix’s database." />

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-lg">
          {reviewSubmitted ? (
            <DialogHeader>
              <DialogTitle className="text-2xl text-emerald-700">Request submitted</DialogTitle>
              <DialogDescription className="pt-2">
                Your request and engagement summary have been emailed to you and Sid at <BrandName />.
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
                <div className="space-y-2">
                  <Label>Security check</Label>
                  {turnstileSiteKey ? (
                    <TurnstileCheck
                      siteKey={turnstileSiteKey}
                      onToken={handleTurnstileToken}
                      onError={handleTurnstileError}
                      resetSignal={turnstileResetSignal}
                    />
                  ) : !turnstileHostAllowed ? (
                    <p role="note" className="text-sm text-slate-600">
                      The security check is enabled on marginmix.ai only. Please use the production site to submit a review request.
                    </p>
                  ) : (
                    <p role="alert" className="text-sm text-amber-800">
                      The security check is not configured yet. Please try again later.
                    </p>
                  )}
                  {turnstileError && <p role="alert" className="text-sm text-red-600">{turnstileError}</p>}
                </div>
                {reviewError && <p role="alert" className="text-sm text-red-600">{reviewError}</p>}
                <Button
                  type="submit"
                  disabled={reviewSubmitting || !turnstileToken || !turnstileSiteKey}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {reviewSubmitting
                    ? "Sending..."
                    : !turnstileHostAllowed
                      ? "Available on marginmix.ai"
                      : turnstileSiteKey && !turnstileToken
                        ? "Complete the security check"
                        : "Submit"}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
