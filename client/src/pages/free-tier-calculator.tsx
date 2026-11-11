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
      return;
    }
    setErrors({});
    const leak = computeLeak(parsed as LeakInput);
    sessionStorage.setItem(LEAK_RESULT_STORAGE_KEY, JSON.stringify(leak));
    analytics.leakFormSubmitted();
    setLocation("/free-tier/calculator/output");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <Header variant="solid" hideDemoButton />
      <main className="max-w-lg mx-auto px-4 pt-24 pb-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Engagement leak calculator
        </h1>
        <p className="text-slate-600 mb-8 text-sm sm:text-base">
          Free indicative range from your fee, team cost, and scope signals. All figures stay in your browser.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fee">Total fee on this engagement, in USD</Label>
            <Input
              id="fee"
              type="number"
              min={1}
              step="any"
              required
              value={numericDrafts.fee}
              className="border-2 border-emerald-600 focus-visible:ring-emerald-500"
              onChange={(e) => updateNumeric("fee", e.target.value)}
            />
            {errors.fee && <p className="text-sm text-red-600">{errors.fee}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="months">How many months the engagement covers, or has run</Label>
            <Input
              id="months"
              type="number"
              min={1}
              max={60}
              step={1}
              required
              value={numericDrafts.months}
              className="border-2 border-emerald-600 focus-visible:ring-emerald-500"
              onChange={(e) => updateNumeric("months", e.target.value)}
            />
            {errors.months && <p className="text-sm text-red-600">{errors.months}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fte">Full-time equivalent people on the account</Label>
            <Input
              id="fte"
              type="number"
              min={0.1}
              max={200}
              step="any"
              required
              value={numericDrafts.fte}
              className="border-2 border-emerald-600 focus-visible:ring-emerald-500"
              onChange={(e) => updateNumeric("fte", e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Count shared people as a fraction. Ten people at 30% each is 3.0.
            </p>
            {errors.fte && <p className="text-sm text-red-600">{errors.fte}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="staffcost">Total staff cost on this account over the same period as the fee, in USD</Label>
            <Input
              id="staffcost"
              type="number"
              min={1}
              step="any"
              required
              value={numericDrafts.staffcost}
              className="border-2 border-emerald-600 focus-visible:ring-emerald-500"
              onChange={(e) => updateNumeric("staffcost", e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Use the total your finance team allocates to this job. If estimating from salary, convert fully loaded salary
              to the entered period before multiplying by FTE.
            </p>
            {errors.staffcost && <p className="text-sm text-red-600">{errors.staffcost}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-margin">Target margin after staff costs</Label>
            <Select
              value={String(form.targetMarginPercent ?? DEFAULT_TARGET_MARGIN_PERCENT)}
              onValueChange={(value) => update("targetMarginPercent", Number(value))}
            >
              <SelectTrigger id="target-margin" className="border-2 border-emerald-600 focus:ring-emerald-500">
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
            <Label htmlFor="scope_move">Scope movement</Label>
            <Select
              value={form.scopemove ?? ""}
              onValueChange={(v) => update("scopemove", v as ScopeMove)}
            >
              <SelectTrigger id="scope_move" className="border-2 border-emerald-600 focus:ring-emerald-500">
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
            <Label htmlFor="scope_billed">Scope billing status</Label>
            <Select
              value={form.scopebilled ?? ""}
              onValueChange={(v) => update("scopebilled", v as ScopeBilled)}
            >
              <SelectTrigger id="scope_billed" className="border-2 border-emerald-600 focus:ring-emerald-500">
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
            <Label htmlFor="hours_tracked">Hours tracked on this account</Label>
            <Select
              value={form.hourstracked ?? ""}
              onValueChange={(v) => update("hourstracked", v as HoursTracked)}
            >
              <SelectTrigger id="hours_tracked" className="border-2 border-emerald-600 focus:ring-emerald-500">
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
    </div>
  );
}
