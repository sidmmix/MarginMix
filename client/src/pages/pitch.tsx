import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, Target, Zap, Users, DollarSign, BarChart3, Rocket, Clock, Shield, ArrowRight } from "lucide-react";

const slides = [
  { id: "cover" },
  { id: "problem" },
  { id: "solution" },
  { id: "why-now" },
  { id: "customer" },
  { id: "revenue" },
  { id: "market" },
  { id: "unit-economics" },
  { id: "scalability" },
  { id: "founder" },
  { id: "ask" },
];

export default function PitchDeck() {
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(slides.length - 1, c + 1)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans select-none">

      {/* Slide Container */}
      <div className="w-full h-full">
        {current === 0 && <SlideCover />}
        {current === 1 && <SlideProblem />}
        {current === 2 && <SlideSolution />}
        {current === 3 && <SlideWhyNow />}
        {current === 4 && <SlideCustomer />}
        {current === 5 && <SlideRevenue />}
        {current === 6 && <SlideMarket />}
        {current === 7 && <SlideUnitEconomics />}
        {current === 8 && <SlideScalability />}
        {current === 9 && <SlideFounder />}
        {current === 10 && <SlideAsk />}
      </div>

      {/* Navigation */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6 z-50">
        <button
          onClick={prev}
          disabled={current === 0}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${i === current ? "w-6 h-2 bg-emerald-400" : "w-2 h-2 bg-white/30 hover:bg-white/50"}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all text-white"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Slide counter */}
      <div className="absolute top-5 right-6 text-white/30 text-xs font-mono z-50">
        {current + 1} / {slides.length}
      </div>

      {/* Keyboard hint */}
      {current === 0 && (
        <div className="absolute bottom-16 left-0 right-0 text-center text-white/25 text-xs">
          Use arrow keys or click to navigate
        </div>
      )}
    </div>
  );
}

function SlideWrapper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center px-8 md:px-20 lg:px-32 ${className}`}>
      {children}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-4">
      {children}
    </span>
  );
}

function Divider() {
  return <div className="w-12 h-0.5 bg-emerald-500 my-5" />;
}

// ── SLIDE 1: COVER ────────────────────────────────────────────────────────────
function SlideCover() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 text-center max-w-4xl">
        <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-6">Investor Presentation · 2026</p>
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">MarginMix</h1>
        <p className="text-xl md:text-2xl text-emerald-300 font-light mb-8">
          The Financial Reasoning Engine for Professional Services
        </p>
        <div className="w-24 h-px bg-emerald-500 mx-auto mb-8" />
        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Pricing and margin risk decisions — made before delivery begins,
          where the cost of being wrong is highest.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-slate-500 text-sm">
          <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-500" /> Deterministic Engine</span>
          <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" /> 60-Second Assessment</span>
          <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" /> 90% Gross Margin</span>
        </div>
      </div>
    </div>
  );
}

// ── SLIDE 2: PROBLEM ──────────────────────────────────────────────────────────
function SlideProblem() {
  const points = [
    { icon: "📋", text: "Timesheets are inaccurate and lagging" },
    { icon: "📉", text: "Historical data is noisy and backward-looking" },
    { icon: "🧠", text: "Complexity and coordination costs are routinely underestimated" },
    { icon: "🤖", text: "AI adoption changes effort patterns — but ROI is unclear" },
    { icon: "👤", text: "Judgment lives in senior operators' heads, not in systems" },
  ];
  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="flex-1 flex flex-col justify-center px-10 md:px-16 lg:px-20 pt-16 pb-8 lg:py-0">
        <Tag>The Problem</Tag>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
          Firms price work before they understand how it will be delivered.
        </h2>
        <Divider />
        <div className="space-y-3 mt-2">
          {points.map((p, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{p.icon}</span>
              <p className="text-slate-300 text-sm md:text-base">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-none lg:w-80 xl:w-96 bg-red-950/30 border-l border-red-900/30 flex items-center justify-center p-10">
        <div className="text-center">
          <p className="text-red-400 text-xs font-semibold tracking-widest uppercase mb-6">The Result</p>
          <div className="space-y-6">
            <div>
              <p className="text-4xl font-bold text-white">$300K–$1M</p>
              <p className="text-slate-400 text-sm mt-1">margin destroyed per year from 1–2 mispriced engagements</p>
            </div>
            <div className="w-12 h-px bg-red-800 mx-auto" />
            <div>
              <p className="text-2xl font-bold text-red-300">Discovered<br />too late</p>
              <p className="text-slate-400 text-sm mt-2">Margin erosion is only visible after damage is done</p>
            </div>
          </div>
          <div className="mt-8 p-4 bg-red-900/20 border border-red-800/40 rounded-xl">
            <p className="text-red-300 text-sm font-medium italic">
              "This is not a margin leakage problem.<br />It is a pricing and commitment risk problem."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SLIDE 3: SOLUTION ─────────────────────────────────────────────────────────
function SlideSolution() {
  const outputs = [
    "Margin risk verdict (5-level classification)",
    "Structural risk drivers identified",
    "Effort concentration bands — Senior / Mid / Execution",
    "Pricing & governance implications",
    "Decision memo usable at CXO / partner level",
    "Estimated margin erosion on current margin",
  ];
  const notThis = [
    "Does not ingest timesheets or ERP data",
    "Does not model delivery performance",
    "Does not replace finance systems",
  ];
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-900 flex flex-col justify-center px-10 md:px-16 lg:px-24 py-16">
      <div className="max-w-6xl mx-auto w-full">
        <Tag>The Solution</Tag>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          One question. One verdict. Before commitment is locked.
        </h2>
        <p className="text-emerald-300 text-lg italic mb-8">
          "Given how this engagement will actually be delivered, is the pricing economically viable?"
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">What MarginMix Outputs</p>
            <div className="space-y-3">
              {outputs.map((o, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-slate-300 text-sm">{o}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-4">What It Is Not</p>
              <div className="space-y-2">
                {notThis.map((n, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-slate-500 text-sm">—</span>
                    <p className="text-slate-400 text-sm">{n}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-2xl p-6">
              <p className="text-emerald-300 text-xs font-bold tracking-widest uppercase mb-3">The Engine</p>
              <p className="text-white text-sm leading-relaxed">
                Deterministic. Rule-based. No ML. No AI in verdict logic.
                Encodes expert judgment into a <strong>repeatable, auditable decision system</strong> that gives the same answer to identical inputs — every time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SLIDE 4: WHY NOW ──────────────────────────────────────────────────────────
function SlideWhyNow() {
  const reasons = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "AI is reshaping delivery economics",
      body: "Firms are adopting AI tools rapidly — but have no framework to price AI-augmented work. The effort mix has changed. The pricing model hasn't.",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "CFOs want predictive confidence",
      body: "Post-pandemic margin pressure means finance leaders are demanding forward-looking risk signals — not post-mortems built on lagging timesheet data.",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "No system sits before commitment",
      body: "Every existing tool — ERP, PSA, BI — operates after delivery begins. The pre-commitment gap is entirely unaddressed. MarginMix owns that moment.",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "The window is open — briefly",
      body: "AI-native firms will build this capability. The window to establish 'Margin Risk Clarity' as the category standard is 18–24 months.",
    },
  ];
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col justify-center px-10 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto w-full">
        <Tag>Why Now</Tag>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Four forces converging — right now.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {reasons.map((r, i) => (
            <div key={i} className="bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors rounded-2xl p-6">
              <div className="text-emerald-400 mb-3">{r.icon}</div>
              <p className="text-white font-semibold mb-2">{r.title}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SLIDE 5: CUSTOMER ─────────────────────────────────────────────────────────
function SlideCustomer() {
  const firmTypes = ["Mid-tier & independent agencies", "Consulting firms", "Digital transformation firms"];
  const buyers = [
    { title: "CFO", desc: "Owns margin accountability" },
    { title: "COO", desc: "Owns delivery risk" },
    { title: "Partner / MD", desc: "Owns deal commitment" },
  ];
  const whyThem = [
    "Make 70–80 pricing decisions annually",
    "Cannot afford large consulting engagements",
    "Lack internal decision systems",
    "Feel margin risk acutely — every missed deal hurts",
    "Fewer decisions = higher stakes per decision",
  ];
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col justify-center px-10 md:px-16 lg:px-24 py-16">
      <div className="max-w-6xl mx-auto w-full">
        <Tag>Target Customer</Tag>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Phase 1 Wedge: Mid-tier Professional Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">Firm Profile</p>
            <p className="text-2xl font-bold text-white mb-1">200–2,000</p>
            <p className="text-slate-400 text-sm mb-5">employees</p>
            <div className="space-y-2">
              {firmTypes.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <p className="text-slate-300 text-sm">{f}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">Key Buyers</p>
            <div className="space-y-4">
              {buyers.map((b, i) => (
                <div key={i} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <p className="text-white font-semibold">{b.title}</p>
                  <p className="text-slate-400 text-sm">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-2xl p-6">
            <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">Why These Firms</p>
            <div className="space-y-3">
              {whyThem.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-300 text-sm">{w}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SLIDE 6: REVENUE MODEL ────────────────────────────────────────────────────
function SlideRevenue() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col justify-center px-10 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto w-full">
        <Tag>Revenue Model</Tag>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Value-based. Decision-anchored. Not seat-based.</h2>
        <p className="text-slate-400 text-sm mb-8">Pricing reflects the value of the decision being protected — not the number of users.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-3">Entry / Assessment</p>
            <p className="text-4xl font-bold text-white mb-1">$89</p>
            <p className="text-slate-400 text-sm mb-4">per submission</p>
            <div className="space-y-2 text-sm text-slate-300">
              <p>— Instant output</p>
              <p>— No free trial</p>
              <p>— Decision memo + PDF</p>
            </div>
          </div>
          <div className="bg-emerald-900/30 border border-emerald-500/40 rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full">Phase 1 Core</div>
            <p className="text-emerald-300 text-xs font-bold tracking-widest uppercase mb-3">Subscription</p>
            <p className="text-4xl font-bold text-white mb-1">$1,250<span className="text-xl text-slate-400">/mo</span></p>
            <p className="text-slate-400 text-sm mb-4">~$15K ACV</p>
            <div className="space-y-2 text-sm text-slate-300">
              <p>— Unlimited submissions</p>
              <p>— Portfolio-level views</p>
              <p>— Deal desk workflows</p>
              <p>— AI ROI simulation</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-3">Phase 2 Expansion</p>
            <p className="text-4xl font-bold text-white mb-1">$2,100<span className="text-xl text-slate-400">/mo</span></p>
            <p className="text-slate-400 text-sm mb-4">~$25K ACV</p>
            <div className="space-y-2 text-sm text-slate-300">
              <p>— Everything in Phase 1</p>
              <p>— Engineering / SI firms</p>
              <p>— Full expansion tier</p>
            </div>
          </div>
        </div>
        <div className="mt-5 p-4 bg-white/3 border border-white/8 rounded-xl text-sm text-slate-400">
          <strong className="text-slate-300">Trigger for subscription launch:</strong> 300 paying customers within 6 months of launch. Assessment-tier revenue funds this.
        </div>
      </div>
    </div>
  );
}

// ── SLIDE 7: MARKET ───────────────────────────────────────────────────────────
function SlideMarket() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col justify-center px-10 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto w-full">
        <Tag>Market Opportunity</Tag>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Large, underserved, and structured for expansion.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-2">TAM</p>
            <p className="text-3xl font-bold text-white mb-1">$600M–$1B</p>
            <p className="text-slate-400 text-sm">~40K firms globally (developed markets + Brazil, South Africa) — 200+ employee agencies, consulting, SIs, ITeS at $15K–$25K ACV</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-2">SAM · Phase 1</p>
            <p className="text-3xl font-bold text-emerald-300 mb-1">$213M</p>
            <p className="text-slate-400 text-sm">14,200 agencies & consulting firms across 13 core markets at $15K ACV. 2–3 year horizon.</p>
          </div>
          <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-6">
            <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-2">SOM · 3 Years</p>
            <p className="text-3xl font-bold text-emerald-400 mb-1">$7.5M ARR</p>
            <p className="text-slate-300 text-sm">500 firms in top 13 markets at $15K ACV. Establishes "Margin Risk Clarity" as the decision-support standard.</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-2">Phase 2 · 5–7 Years</p>
              <p className="text-2xl font-bold text-white">$25M ARR</p>
              <p className="text-slate-400 text-sm mt-1">27,090 firms (adding Engineering / SIs) at $24K ACV. 2.5% of TAM capture.</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-2">Strategic Transition</p>
              <p className="text-white text-sm leading-relaxed">From boutique advisory tool → <strong className="text-emerald-300">essential operational guardrail</strong> — the 5-minute AI Deal Desk utility embedded in every pricing decision.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SLIDE 8: UNIT ECONOMICS ───────────────────────────────────────────────────
function SlideUnitEconomics() {
  const metrics = [
    { label: "Gross Margin", value: "90%", sub: "Minimal COGS — LLM narration + infra only", color: "text-emerald-400" },
    { label: "CAC", value: "Low", sub: "Founder-led sales initially. No channel cost in early stage", color: "text-blue-400" },
    { label: "Onboarding Cost", value: "$0", sub: "No integrations. No implementation. Instant assessment output", color: "text-purple-400" },
    { label: "ACV", value: "~$15K", sub: "Even one avoided bad engagement justifies multiple years of subscription", color: "text-amber-400" },
    { label: "Decision Frequency", value: "70–80/yr", sub: "Typical mid-tier firm pricing decisions — episodic, high-stakes", color: "text-red-400" },
    { label: "Payback", value: "< 1 deal", sub: "A single flagged engagement typically saves more than the annual fee", color: "text-emerald-400" },
  ];
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col justify-center px-10 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto w-full">
        <Tag>Unit Economics</Tag>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">High-margin decision product. Not services-heavy SaaS.</h2>
        <p className="text-slate-400 text-sm mb-8">The cost structure is built for scale. The value proposition is built for retention.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className={`text-2xl md:text-3xl font-bold mb-1 ${m.color}`}>{m.value}</p>
              <p className="text-white text-sm font-medium mb-2">{m.label}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SLIDE 9: SCALABILITY ──────────────────────────────────────────────────────
function SlideScalability() {
  const reasons = [
    { title: "Judgment is systemized", body: "Expert knowledge encoded once. Delivered infinitely. No per-client consulting required." },
    { title: "AI amplifies speed, not logic", body: "GPT generates narratives only. The verdict logic is deterministic — auditable, repeatable, trustworthy." },
    { title: "Same engine, every industry", body: "Agencies, consulting, SIs, ITeS. The Workforce Intensity Matrix applies universally across professional services." },
    { title: "No integration overhead", body: "Zero ERP/PSA connections needed. Assessment runs on structured inputs alone — no IT project, no implementation risk." },
    { title: "Decision infrastructure, not software", body: "Customers don't churn from decision infrastructure. Once embedded in the pricing process, switching cost is high." },
  ];
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col justify-center px-10 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto w-full">
        <Tag>Why This Scales</Tag>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          Decision infrastructure compounds. It doesn't erode.
        </h2>
        <div className="space-y-3">
          {reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-5 bg-white/4 border border-white/8 rounded-xl px-5 py-4 hover:border-emerald-500/20 transition-colors">
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-0.5">{r.title}</p>
                <p className="text-slate-400 text-sm">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SLIDE 10: FOUNDER ─────────────────────────────────────────────────────────
function SlideFounder() {
  const advantages = [
    "Deep operating experience across large, labor-intensive professional services organisations",
    "First-hand understanding of how pricing decisions are actually made at the senior level",
    "Ability to encode judgment that others treat as intuition — and make it repeatable",
    "Built the World's first Workforce Intensity Matrix — the proprietary framework powering the engine",
    "Category creator advantage: defined the problem space before the market named it",
  ];
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 flex flex-col justify-center px-10 md:px-16 lg:px-24 py-16">
      <div className="max-w-4xl mx-auto w-full">
        <Tag>Founder Advantage</Tag>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          The insight can't be reverse-engineered without the experience.
        </h2>
        <p className="text-slate-400 text-sm mb-8">
          MarginMix exists because of a specific, hard-won operating perspective — one that took years of front-line pricing decisions to develop.
        </p>
        <div className="space-y-3 mb-8">
          {advantages.map((a, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-2" />
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
        <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-2xl p-6">
          <p className="text-emerald-200 text-base md:text-lg italic leading-relaxed">
            "MarginMix helps professional services firms price work with confidence by systematising margin risk decisions before delivery begins — where mistakes are most expensive."
          </p>
        </div>
      </div>
    </div>
  );
}

// ── SLIDE 11: THE ASK ─────────────────────────────────────────────────────────
function SlideAsk() {
  const milestones = [
    { phase: "0–6 mo", goal: "300 paying assessment customers", metric: "$89 × 300 = $26.7K MRR run-rate" },
    { phase: "6–18 mo", goal: "Subscription launch + 50 firms", metric: "$62.5K MRR / $750K ARR" },
    { phase: "18–36 mo", goal: "500 subscription firms", metric: "$625K MRR / $7.5M ARR" },
  ];
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-emerald-950/10 to-slate-900 flex flex-col justify-center px-10 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto w-full">
        <Tag>The Opportunity</Tag>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          A category-defining product at the right moment.
        </h2>
        <p className="text-slate-400 text-sm mb-8">
          The pre-commitment margin risk window is open, unoccupied, and structurally important to every professional services firm.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {milestones.map((m, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent" />
              <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-2">{m.phase}</p>
              <p className="text-white text-sm font-semibold mb-2">{m.goal}</p>
              <p className="text-slate-400 text-xs">{m.metric}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-3">Use of Funds</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-300">Product & Engineering</span><span className="text-white font-medium">40%</span></div>
              <div className="flex justify-between"><span className="text-slate-300">GTM & Founder-led Sales</span><span className="text-white font-medium">35%</span></div>
              <div className="flex justify-between"><span className="text-slate-300">Infrastructure & Ops</span><span className="text-white font-medium">15%</span></div>
              <div className="flex justify-between"><span className="text-slate-300">Reserve</span><span className="text-white font-medium">10%</span></div>
            </div>
          </div>
          <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-emerald-300 text-xs font-bold tracking-widest uppercase mb-3">Why MarginMix Wins</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                First mover. Proprietary framework. Deterministic engine. No integration cost. High gross margin. Founder with operating insight the market hasn't yet systemised.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-emerald-300 text-sm font-medium">
              <Rocket className="h-4 w-4" />
              <span>marginmix.ai</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
