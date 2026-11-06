import { useState } from "react";
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
} from "@shared/leak-engine";

const emptyForm: Partial<LeakInput> = {
  scopemove: undefined,
  scopebilled: undefined,
  hourstracked: undefined,
};

export default function FreeTierCalculatorPage() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<Partial<LeakInput>>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  const update = <K extends keyof LeakInput>(key: K, value: LeakInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed: Partial<LeakInput> = {
      fee: Number(form.fee),
      months: Number(form.months),
      fte: Number(form.fte),
      staffcost: Number(form.staffcost),
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
              value={form.fee ?? ""}
              onChange={(e) => update("fee", Number(e.target.value) as LeakInput["fee"])}
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
              value={form.months ?? ""}
              onChange={(e) => update("months", Number(e.target.value))}
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
              value={form.fte ?? ""}
              onChange={(e) => update("fte", Number(e.target.value))}
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
              value={form.staffcost ?? ""}
              onChange={(e) => update("staffcost", Number(e.target.value))}
            />
            <p className="text-xs text-slate-500">
              Use what your finance team allocates to this job, or FTE times your average fully loaded salary.
            </p>
            {errors.staffcost && <p className="text-sm text-red-600">{errors.staffcost}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope_move">Scope movement</Label>
            <Select
              value={form.scopemove ?? ""}
              onValueChange={(v) => update("scopemove", v as ScopeMove)}
            >
              <SelectTrigger id="scope_move">
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
              <SelectTrigger id="scope_billed">
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
              <SelectTrigger id="hours_tracked">
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
