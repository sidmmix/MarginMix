import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { analytics } from "@/lib/analytics";
import {
  computeLeak,
  LEAK_RESULT_STORAGE_KEY,
  validateLeakInput,
  type LeakInput,
  type ScopeBilled,
  type ScopeMove,
  type HoursTracked,
  DEFAULT_TARGET_MARGIN_PERCENT,
  TARGET_MARGIN_OPTIONS,
} from "@shared/leak-engine";

const emptyForm: Partial<LeakInput> = {
  targetMarginPercent: DEFAULT_TARGET_MARGIN_PERCENT,
  scopemove: undefined,
  scopebilled: undefined,
  hourstracked: undefined,
};

type NumericInputKey = "fee" | "months" | "fte" | "staffcost";

export default function FreeTierCalculatorPage() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<Partial<LeakInput>>(emptyForm);
  const [numericDrafts, setNumericDrafts] = useState<Record<NumericInputKey, string>>({
    fee: "",
    months: "",
    fte: "",
    staffcost: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const startTracked = useRef(false);

  useEffect(() => {
    if (startTracked.current) return;
    startTracked.current = true;
    analytics.leakFormStarted();
  }, []);

  const update = <K extends keyof LeakInput>(key: K, value: LeakInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateNumeric = (key: NumericInputKey, value: string) => {
    setNumericDrafts((prev) => ({ ...prev, [key]: value }));
    setForm((prev) => ({
      ...prev,
      [key]: value.trim() === "" ? undefined : Number(value),
    }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateField = (key: keyof LeakInput) => {
    const message = validateLeakInput(form).errors[key];
    setErrors((prev) => {
      if (!message && !prev[key]) return prev;
      const next = { ...prev };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed: Partial<LeakInput> = {
      fee: Number(form.fee),
      months: Number(form.months),
      fte: Number(form.fte),
      staffcost: Number(form.staffcost),
      targetMarginPercent: Number(form.targetMarginPercent ?? DEFAULT_TARGET_MARGIN_PERCENT),
      scopemove: form.scopemove,
      scopebilled: form.scopebilled,
      hourstracked: form.hourstracked,
    };
    const result = validateLeakInput(parsed);
    setWarnings(result.warnings);
    if (!result.valid) {
      setErrors(result.errors as Record<string, string>);
      requestAnimationFrame(() => {
        const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalid?.focus();
      });
      return;
    }
    setErrors({});
    const leak = computeLeak(parsed as LeakInput);
    sessionStorage.setItem(LEAK_RESULT_STORAGE_KEY, JSON.stringify(leak));
    analytics.leakFormSubmitted();
    setLocation("/free-tier/calculator/output");
  };

  const controlClass = (field: keyof LeakInput) =>
    errors[field]
      ? "border-2 border-red-500 bg-red-50/40 ring-2 ring-red-500/20 focus:ring-red-500 focus-visible:ring-red-500"
      : "border-2 border-emerald-600 focus:ring-emerald-500 focus-visible:ring-emerald-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <Header
        variant="solid"
        hideDemoButton
        notice="Calculator inputs and results stay in your browser. Submitting a review request emails your contact details and engagement summary to you and MarginMix."
      />
      <main className="max-w-lg mx-auto px-4 pt-24 pb-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Engagement leak calculator
        </h1>
        <p className="text-slate-600 mb-8 text-sm sm:text-base">
          Free indicative range from your fee, team cost, and scope signals. All figures stay in your browser.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-red-600">*</span> All fields are required.
          </p>
          <div className="space-y-2">
            <Label htmlFor="fee">Total fee on this engagement, in USD <span aria-hidden="true" className="text-red-600">*</span></Label>
            <Input
              id="fee"
              type="number"
              min={1}
              step="any"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.fee)}
              value={numericDrafts.fee}
              className={controlClass("fee")}
              onChange={(e) => updateNumeric("fee", e.target.value)}
              onBlur={() => validateField("fee")}
            />
            {errors.fee && <p className="text-sm text-red-600">{errors.fee}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="months">How many months the engagement covers, or has run <span aria-hidden="true" className="text-red-600">*</span></Label>
            <Input
              id="months"
              type="number"
              min={1}
              max={60}
              step={1}
              required
              aria-required="true"
              aria-invalid={Boolean(errors.months)}
              value={numericDrafts.months}
              className={controlClass("months")}
              onChange={(e) => updateNumeric("months", e.target.value)}
              onBlur={() => validateField("months")}
            />
            {errors.months && <p className="text-sm text-red-600">{errors.months}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fte">Full-time equivalent people on the account <span aria-hidden="true" className="text-red-600">*</span></Label>
            <Input
              id="fte"
              type="number"
              min={0.1}
              max={200}
              step="any"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.fte)}
              value={numericDrafts.fte}
              className={controlClass("fte")}
              onChange={(e) => updateNumeric("fte", e.target.value)}
              onBlur={() => validateField("fte")}
            />
            <p className="text-xs text-slate-500">
              Count shared people as a fraction. Ten people at 30% each is 3.0.
            </p>
            {errors.fte && <p className="text-sm text-red-600">{errors.fte}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="staffcost">Total staff cost on this account over the same period as the fee, in USD <span aria-hidden="true" className="text-red-600">*</span></Label>
            <Input
              id="staffcost"
              type="number"
              min={1}
              step="any"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.staffcost)}
              value={numericDrafts.staffcost}
              className={controlClass("staffcost")}
              onChange={(e) => updateNumeric("staffcost", e.target.value)}
              onBlur={() => validateField("staffcost")}
            />
            <p className="text-xs text-slate-500">
              Use the total your finance team allocates to this job. If estimating from salary, convert fully loaded salary
              to the entered period before multiplying by FTE.
            </p>
            {errors.staffcost && <p className="text-sm text-red-600">{errors.staffcost}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-margin">Target margin after staff costs <span aria-hidden="true" className="text-red-600">*</span></Label>
            <Select
              value={String(form.targetMarginPercent ?? DEFAULT_TARGET_MARGIN_PERCENT)}
              onValueChange={(value) => update("targetMarginPercent", Number(value))}
            >
              <SelectTrigger
                id="target-margin"
                aria-required="true"
                aria-invalid={Boolean(errors.targetMarginPercent)}
                className={controlClass("targetMarginPercent")}
                onBlur={() => validateField("targetMarginPercent")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_MARGIN_OPTIONS.map((margin) => (
                  <SelectItem key={margin} value={String(margin)}>{margin}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              The calculator derives a staff-cost ceiling from this target. It is a planning assumption, not an industry benchmark.
            </p>
            {errors.targetMarginPercent && <p className="text-sm text-red-600">{errors.targetMarginPercent}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope_move">Scope movement <span aria-hidden="true" className="text-red-600">*</span></Label>
            <Select
              value={form.scopemove ?? ""}
              onValueChange={(v) => update("scopemove", v as ScopeMove)}
            >
              <SelectTrigger
                id="scope_move"
                aria-required="true"
                aria-invalid={Boolean(errors.scopemove)}
                className={controlClass("scopemove")}
                onBlur={() => validateField("scopemove")}
              >
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="slight">Slight</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="significant">Significant</SelectItem>
              </SelectContent>
            </Select>
            {errors.scopemove && <p className="text-sm text-red-600">{errors.scopemove}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope_billed">Scope billing status <span aria-hidden="true" className="text-red-600">*</span></Label>
            <Select
              value={form.scopebilled ?? ""}
              onValueChange={(v) => update("scopebilled", v as ScopeBilled)}
            >
              <SelectTrigger
                id="scope_billed"
                aria-required="true"
                aria-invalid={Boolean(errors.scopebilled)}
                className={controlClass("scopebilled")}
                onBlur={() => validateField("scopebilled")}
              >
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="billed">Billed</SelectItem>
                <SelectItem value="partly_billed">Partly billed</SelectItem>
                <SelectItem value="unbilled">Unbilled</SelectItem>
              </SelectContent>
            </Select>
            {errors.scopebilled && <p className="text-sm text-red-600">{errors.scopebilled}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours_tracked">Hours tracked on this account <span aria-hidden="true" className="text-red-600">*</span></Label>
            <Select
              value={form.hourstracked ?? ""}
              onValueChange={(v) => update("hourstracked", v as HoursTracked)}
            >
              <SelectTrigger
                id="hours_tracked"
                aria-required="true"
                aria-invalid={Boolean(errors.hourstracked)}
                className={controlClass("hourstracked")}
                onBlur={() => validateField("hourstracked")}
              >
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="partly">Partly</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            {errors.hourstracked && <p className="text-sm text-red-600">{errors.hourstracked}</p>}
          </div>

          {Object.keys(errors).length > 0 && (
            <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
              Complete or correct all fields highlighted in red before calculating.
            </div>
          )}

          {warnings.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="space-y-1 text-amber-900">
                {warnings.map((w) => (
                  <p key={w}>{w}</p>
                ))}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-base">
            Calculate engagement leak
          </Button>
        </form>
      </main>
      <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-sm text-slate-700">
        <p className="font-bold">
          Calculator inputs and results stay in your browser. Submitting a review request emails your contact details and engagement summary to you and MarginMix.
        </p>
      </footer>
    </div>
  );
}
