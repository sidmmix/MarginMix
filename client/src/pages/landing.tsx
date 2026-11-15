import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle, Users, Building2, Briefcase, Target, Shield, TrendingUp, BarChart3, Zap } from "lucide-react";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BrandName } from "@/components/brand-name";
import { AnimatedSection } from "@/components/animations";
import { staggerContainer, staggerItem } from "@/components/motion-variants";
import { computeLeak, formatPercent, formatUsd, formatUsdBandHeadline, type LeakInput } from "@shared/leak-engine";

const homepageSampleInput: LeakInput = {
  currency: "USD",
  fee: 100_000,
  months: 3,
  fte: 3.33,
  staffcost: 75_000,
  targetMarginPercent: 40,
  scopemove: "moderate",
  scopebilled: "unbilled",
  hourstracked: "no",
};
const homepageSampleResult = computeLeak(homepageSampleInput);

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.08 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function Landing() {
  const shouldReduce = useReducedMotion();
  return (
    <div className="mm-page mm-home min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-700/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-700/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-100/20 to-teal-100/20 dark:from-emerald-800/10 dark:to-teal-800/10 rounded-full blur-3xl"></div>
      </div>

      <Header />

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* Hero Section */}
      <section className="mm-home-hero relative overflow-hidden pt-6 sm:pt-10 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid items-center gap-10 text-left lg:grid-cols-[1.05fr_.95fr]"
            variants={shouldReduce ? undefined : heroContainer}
            initial={shouldReduce ? undefined : "hidden"}
            animate={shouldReduce ? undefined : "show"}
          >
            <div className="relative z-10">
            <motion.h1
              variants={shouldReduce ? undefined : heroItem}
              className="mm-display max-w-3xl text-4xl sm:text-5xl md:text-6xl lg:text-[4.4rem] font-extrabold text-[#f8f6ee] mb-5"
            >
              Make Margin Risk Visible.
            </motion.h1>

            <motion.p
              variants={shouldReduce ? undefined : heroItem}
              className="max-w-xl text-base sm:text-lg md:text-xl text-[#d1e0d8] mb-6 leading-relaxed"
            >
              Pressure test pricing, staffing, and delivery assumptions of an engagement.
            </motion.p>

            <motion.p
              variants={shouldReduce ? undefined : heroItem}
              className="max-w-xl text-base sm:text-lg font-semibold text-[#eff3e9] mb-7"
            >
              <BrandName className="mm-brand-pad" /> is structured decision support for{" "}
                  <span className="text-[#d5e96c]">pricing & margin risk.</span>{" "}
              Not a productivity or time tracking system.
            </motion.p>

            <motion.div
              variants={shouldReduce ? undefined : heroItem}
              className="flex flex-col items-start gap-3 sm:flex-row"
            >
              <Link href="/free-tier/input" className="mm-action inline-flex w-full items-center justify-center bg-[#d5e96c] px-6 py-3.5 text-sm font-bold text-[#183b37] hover:bg-[#e2f48a] sm:w-auto sm:px-8 sm:py-4 sm:text-base">
                Try Free Scanner
              </Link>
            </motion.div>

            </div>
            <motion.div variants={shouldReduce ? undefined : heroItem} className="relative mt-2 mx-auto w-full max-w-lg lg:mt-0">
              <div className="absolute inset-x-7 top-7 bottom-0 rotate-[-5deg] rounded-[2rem] border border-white/10 bg-[#0e302c]/50" />
              <div className="relative rounded-[2rem] border border-white/15 bg-[#f5f3eb] p-4 shadow-[0_28px_70px_rgba(0,0,0,.22)] sm:p-6">
                <div className="flex items-center justify-between border-b border-[#e3e8df] pb-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#789087]">Calculator result</p><p className="mt-1 font-bold text-[#183b37]">Sample engagement · USD</p></div>
                  <span className="rounded-full bg-[#e7f0e8] px-3 py-1 text-xs font-bold text-[#146d58]">Engine calculated</span>
                </div>
                <div className="mt-5 rounded-2xl bg-[#e6f0e4] p-4 sm:p-5">
                  <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#5f8074]">Indicative exposure range</p>
                  <p className="mm-number mt-1 text-3xl font-extrabold leading-tight text-[#183b37] sm:text-4xl">
                    {formatUsdBandHeadline(homepageSampleResult.leaklow)} to {formatUsdBandHeadline(homepageSampleResult.leakhigh)}
                  </p>
                  <p className="mt-2 text-sm text-[#45635a]">
                    Combined exposure indicator: {formatUsd(homepageSampleResult.leakpoint)}, or {formatPercent(homepageSampleResult.leakpctmid, 1)} of fee.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#dce5dc] bg-white p-3">
                    <p className="text-xs font-semibold text-[#60776f]">Delivery cost exposure</p>
                    <p className="mm-number mt-1 text-xl font-extrabold text-[#183b37]">{formatUsd(homepageSampleResult.deliveryleak)}</p>
                  </div>
                  <div className="rounded-xl border border-[#dce5dc] bg-white p-3">
                    <p className="text-xs font-semibold text-[#60776f]">Scope exposure</p>
                    <p className="mm-number mt-1 text-xl font-extrabold text-[#183b37]">{formatUsd(homepageSampleResult.scopeleak)}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-[#45635a]">
                  At the 40% target, the model estimates a required fee of {formatUsd(homepageSampleResult.requiredfee)} and an uplift of {formatUsd(homepageSampleResult.feeshortfall)}.
                </p>
                <details className="mt-4 border-t border-[#e3e8df] pt-3 text-xs text-[#60776f]">
                  <summary className="cursor-pointer font-semibold text-[#146d58]">See sample inputs</summary>
                  <p className="mt-2 leading-relaxed">
                    Fee {formatUsd(homepageSampleInput.fee)}, staff cost {formatUsd(homepageSampleInput.staffcost)}, {homepageSampleInput.months} months, {homepageSampleInput.fte} FTE, 40% target margin, moderate scope creep marked unbilled, and hours not tracked.
                  </p>
                </details>
                <p className="mt-3 text-[10px] leading-relaxed text-[#789087]">Sample calculation using the same engine as the calculator results page. Not a live engagement.</p>
                <Link href="/free-tier/input" className="mt-3 inline-flex text-sm font-bold text-[#146d58] hover:underline">
                  Run your own numbers <span aria-hidden="true" className="ml-1">→</span>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Margin Gap Statement */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <AnimatedSection className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="italic text-gray-500 dark:text-gray-400 text-base sm:text-lg leading-relaxed mb-4">
            "Agencies benchmark 18–20% EBITDA. Most realize 13% or less. For a $25M agency, that gap is worth over $1.5M a year. The cause is often delivery complexity that was never priced in, not bad clients."
          </p>
          <p className="text-lg sm:text-xl font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
            <BrandName /> helps you plug that gap!
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Figures derived from publicly available data
          </p>
        </AnimatedSection>
      </section>

      {/* Context band: AI + Commercial Models */}
      <section className="py-10 bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <AnimatedSection className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-center justify-center">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">AI is reshaping delivery</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI changes how work gets done. Most pricing models have not caught up, creating a hidden margin gap.</p>
              </div>
            </div>
            <div className="hidden md:block w-px h-12 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Works across all commercial models</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Time & Materials · Fixed Price · Outcome-based · Hybrid engagements</p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Example Verdicts */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 text-center">
              What <BrandName /> tells you
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-12 text-sm sm:text-base">
              Real verdict scenarios from the decision engine. Every output is deterministic, not generated by AI.
            </p>
          </AnimatedSection>

          <motion.div
            className="space-y-6 max-w-5xl mx-auto"
            variants={shouldReduce ? undefined : staggerContainer}
            initial={shouldReduce ? undefined : "hidden"}
            whileInView={shouldReduce ? undefined : "show"}
            viewport={{ once: true, margin: "-60px" }}
          >

            {/* Verdict 1: Structurally Safe */}
            <motion.details name="marginmix-verdict" variants={shouldReduce ? undefined : staggerItem} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#153e38]">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-white outline-none focus-visible:ring-2 focus-visible:ring-[#d5e96c] sm:px-7">
                <span><span className="font-bold">Structurally Safe</span><span className="ml-2 text-xs text-emerald-300">Low risk · 22/100 · 18% to 17%</span></span><span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold text-[#d5e96c]">View scenario</span>
              </summary>
              <div className="p-6 sm:p-8">
                <div className="rounded-xl border bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 p-5 sm:p-6 mb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <h3 className="text-xl sm:text-2xl font-bold text-emerald-400">Structurally Safe</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-500/20 text-emerald-400 border-emerald-500/30 w-fit">
                      Low Risk
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    Delivery complexity is contained. Coordination overhead is low, senior involvement is predictable, and scope boundaries are well-defined. Margin is protected by structural clarity.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Composite Risk Score</span>
                        <span className="font-mono font-bold text-white">22/100</span>
                      </div>
                      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: "22%" }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                  {[
                    { name: "Workforce", level: "Low", icon: Users, color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" },
                    { name: "Coordination", level: "Low", icon: Zap, color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" },
                    { name: "Commercial", level: "Low", icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" },
                    { name: "Volatility", level: "Low", icon: AlertTriangle, color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" },
                    { name: "Confidence", level: "Positive", icon: Shield, color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" },
                    { name: "Measurement", level: "Low", icon: BarChart3, color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" },
                  ].map((dim) => (
                    <div key={dim.name} className="text-center p-2 rounded-lg bg-white/5 border border-white/10">
                      <dim.icon className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                      <p className="text-[10px] text-gray-500 mb-1">{dim.name}</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${dim.color}`}>
                        {dim.level}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-gray-500 mb-2">Estimated Margin Impact</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500">Current</p>
                      <p className="text-lg font-bold text-white">18%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500">Est. Loss</p>
                      <p className="text-lg font-bold text-emerald-400">-1%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500">Effective</p>
                      <p className="text-lg font-bold text-emerald-400">17%</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.details>

            {/* Verdict 2: Price Sensitive */}
            <motion.details name="marginmix-verdict" variants={shouldReduce ? undefined : staggerItem} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#153e38]">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-white outline-none focus-visible:ring-2 focus-visible:ring-[#d5e96c] sm:px-7">
                <span><span className="font-bold">Price Sensitive</span><span className="ml-2 text-xs text-amber-200">Moderate risk · 52/100 · 15% to 8%</span></span><span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold text-[#d5e96c]">View scenario</span>
              </summary>
              <div className="p-6 sm:p-8">
                <div className="rounded-xl border bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30 p-5 sm:p-6 mb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <h3 className="text-xl sm:text-2xl font-bold text-amber-400">Price Sensitive</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-amber-500/20 text-amber-400 border-amber-500/30 w-fit">
                      Moderate Risk
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    Commercial exposure is elevated. The pricing model may not adequately cover the level of effort required. Margin erosion is likely unless pricing is renegotiated or scope is contained.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Composite Risk Score</span>
                        <span className="font-mono font-bold text-white">52/100</span>
                      </div>
                      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: "52%" }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                  {[
                    { name: "Workforce", level: "Medium", icon: Users, color: "text-amber-400 bg-amber-500/20 border-amber-500/30" },
                    { name: "Coordination", level: "Medium", icon: Zap, color: "text-amber-400 bg-amber-500/20 border-amber-500/30" },
                    { name: "Commercial", level: "High", icon: TrendingUp, color: "text-red-400 bg-red-500/20 border-red-500/30" },
                    { name: "Volatility", level: "Medium", icon: AlertTriangle, color: "text-amber-400 bg-amber-500/20 border-amber-500/30" },
                    { name: "Confidence", level: "Neutral", icon: Shield, color: "text-amber-400 bg-amber-500/20 border-amber-500/30" },
                    { name: "Measurement", level: "Medium", icon: BarChart3, color: "text-amber-400 bg-amber-500/20 border-amber-500/30" },
                  ].map((dim) => (
                    <div key={dim.name} className="text-center p-2 rounded-lg bg-white/5 border border-white/10">
                      <dim.icon className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                      <p className="text-[10px] text-gray-500 mb-1">{dim.name}</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${dim.color}`}>
                        {dim.level}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-gray-500 mb-2">Estimated Margin Impact</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500">Current</p>
                      <p className="text-lg font-bold text-white">15%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500">Est. Loss</p>
                      <p className="text-lg font-bold text-amber-400">-7%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500">Effective</p>
                      <p className="text-lg font-bold text-amber-400">8%</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.details>

            {/* Verdict 3: Structurally Fragile */}
            <motion.details name="marginmix-verdict" variants={shouldReduce ? undefined : staggerItem} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#153e38]">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-white outline-none focus-visible:ring-2 focus-visible:ring-[#d5e96c] sm:px-7">
                <span><span className="font-bold">Structurally Fragile</span><span className="ml-2 text-xs text-red-200">High risk · 74/100 · 20% to 6%</span></span><span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold text-[#d5e96c]">View scenario</span>
              </summary>
              <div className="p-6 sm:p-8">
                <div className="rounded-xl border bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30 p-5 sm:p-6 mb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <h3 className="text-xl sm:text-2xl font-bold text-red-400">Structurally Fragile</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-red-500/20 text-red-400 border-red-500/30 w-fit">
                      High Risk
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    Workforce intensity and coordination entropy are both elevated. Senior effort is being consumed by structural complexity rather than value creation. Margin is at risk of systemic erosion.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Composite Risk Score</span>
                        <span className="font-mono font-bold text-white">74/100</span>
                      </div>
                      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-red-500" style={{ width: "74%" }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                  {[
                    { name: "Workforce", level: "High", icon: Users, color: "text-red-400 bg-red-500/20 border-red-500/30" },
                    { name: "Coordination", level: "High", icon: Zap, color: "text-red-400 bg-red-500/20 border-red-500/30" },
                    { name: "Commercial", level: "Medium", icon: TrendingUp, color: "text-amber-400 bg-amber-500/20 border-amber-500/30" },
                    { name: "Volatility", level: "High", icon: AlertTriangle, color: "text-red-400 bg-red-500/20 border-red-500/30" },
                    { name: "Confidence", level: "Neutral", icon: Shield, color: "text-amber-400 bg-amber-500/20 border-amber-500/30" },
                    { name: "Measurement", level: "High", icon: BarChart3, color: "text-red-400 bg-red-500/20 border-red-500/30" },
                  ].map((dim) => (
                    <div key={dim.name} className="text-center p-2 rounded-lg bg-white/5 border border-white/10">
                      <dim.icon className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                      <p className="text-[10px] text-gray-500 mb-1">{dim.name}</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${dim.color}`}>
                        {dim.level}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-gray-500 mb-2">Estimated Margin Impact</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500">Current</p>
                      <p className="text-lg font-bold text-white">20%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500">Est. Loss</p>
                      <p className="text-lg font-bold text-red-400">-14%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500">Effective</p>
                      <p className="text-lg font-bold text-red-400">6%</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.details>

            {/* Verdict 4: Do Not Proceed Without Repricing */}
            <motion.details name="marginmix-verdict" variants={shouldReduce ? undefined : staggerItem} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#153e38]">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-white outline-none focus-visible:ring-2 focus-visible:ring-[#d5e96c] sm:px-7">
                <span><span className="font-bold">Do Not Proceed Without Repricing</span><span className="ml-2 text-xs text-red-200">Very high risk · 89/100 · 16% to -4%</span></span><span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold text-[#d5e96c]">View scenario</span>
              </summary>
              <div className="p-6 sm:p-8">
                <div className="rounded-xl border bg-gradient-to-br from-red-600/20 to-red-700/10 border-red-600/30 p-5 sm:p-6 mb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <h3 className="text-xl sm:text-2xl font-bold text-red-500">Do Not Proceed Without Repricing</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-red-600/20 text-red-500 border-red-600/30 w-fit">
                      Very High Risk
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    Confidence signal is negative. The engagement lacks the structural conditions for margin protection. Proceeding at current pricing carries a high probability of material margin loss.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Composite Risk Score</span>
                        <span className="font-mono font-bold text-white">89/100</span>
                      </div>
                      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-red-500" style={{ width: "89%" }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                  {[
                    { name: "Workforce", level: "High", icon: Users, color: "text-red-400 bg-red-500/20 border-red-500/30" },
                    { name: "Coordination", level: "High", icon: Zap, color: "text-red-400 bg-red-500/20 border-red-500/30" },
                    { name: "Commercial", level: "High", icon: TrendingUp, color: "text-red-400 bg-red-500/20 border-red-500/30" },
                    { name: "Volatility", level: "High", icon: AlertTriangle, color: "text-red-400 bg-red-500/20 border-red-500/30" },
                    { name: "Confidence", level: "Negative", icon: Shield, color: "text-red-400 bg-red-500/20 border-red-500/30" },
                    { name: "Measurement", level: "High", icon: BarChart3, color: "text-red-400 bg-red-500/20 border-red-500/30" },
                  ].map((dim) => (
                    <div key={dim.name} className="text-center p-2 rounded-lg bg-white/5 border border-white/10">
                      <dim.icon className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                      <p className="text-[10px] text-gray-500 mb-1">{dim.name}</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${dim.color}`}>
                        {dim.level}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-gray-500 mb-2">Estimated Margin Impact</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500">Current</p>
                      <p className="text-lg font-bold text-white">16%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500">Est. Loss</p>
                      <p className="text-lg font-bold text-red-400">-20%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500">Effective</p>
                      <p className="text-lg font-bold text-red-500">-4%</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.details>

          </motion.div>

          <AnimatedSection delay={0.1}>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
              These are illustrative scenarios showing actual verdict types from the <BrandName /> decision engine
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Pre and post comparison */}
      <details className="bg-white dark:bg-gray-800">
        <summary className="mx-auto flex max-w-5xl cursor-pointer items-center justify-between gap-4 px-4 py-6 text-left text-sm font-bold text-[#183b37] outline-none focus-visible:ring-2 focus-visible:ring-[#146d58] sm:px-8">
          <span>Before and after</span>
          <span className="text-xs font-semibold text-[#146d58]">See the full comparison</span>
        </summary>
      <section className="py-20 bg-white dark:bg-gray-800">
        <AnimatedSection className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">Before <BrandName /></h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 mt-1 flex-shrink-0">&#x2022;</span>
                  <span className="text-base md:text-lg text-gray-600 dark:text-gray-400">Pricing decisions rely on heuristics and experience</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 mt-1 flex-shrink-0">&#x2022;</span>
                  <span className="text-base md:text-lg text-gray-600 dark:text-gray-400">Delivery complexity is discussed, not quantified</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 mt-1 flex-shrink-0">&#x2022;</span>
                  <span className="text-base md:text-lg text-gray-600 dark:text-gray-400">Senior involvement is assumed</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 mt-1 flex-shrink-0">&#x2022;</span>
                  <span className="text-base md:text-lg text-gray-600 dark:text-gray-400">Iteration risk emerges after work begins</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 mt-1 flex-shrink-0">&#x2022;</span>
                  <span className="text-base md:text-lg text-gray-600 dark:text-gray-400">Margin outcomes are discovered late</span>
                </li>
              </ul>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-8">
              <h3 className="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-6">With <BrandName /></h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-base md:text-lg text-gray-700 dark:text-gray-300">Pricing decisions are supported by structured signals</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-base md:text-lg text-gray-700 dark:text-gray-300">Delivery complexity is made explicit upfront</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-base md:text-lg text-gray-700 dark:text-gray-300">Senior and coordination effort are visible early</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-base md:text-lg text-gray-700 dark:text-gray-300">Iteration risk is flagged before commitment</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-base md:text-lg text-gray-700 dark:text-gray-300">Margin risk is known at the decision point</span>
                </li>
              </ul>
            </div>
          </div>
        </AnimatedSection>
      </section>
      </details>

      {/* What MarginMix Does */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                What <BrandName /> does
              </h2>
              <p className="text-base md:text-xl text-gray-700 dark:text-gray-300 mb-12 text-center max-w-3xl mx-auto">
                <BrandName /> is a pricing and margin assurance layer. It evaluates structural viability from how work will be staffed, governed, and reviewed.
              </p>
            </AnimatedSection>
            
            <div className="space-y-10">
              {/* What We Measure */}
              <AnimatedSection>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-emerald-500 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  What We Measure
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Senior attention required over time</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Coordination overhead as stakeholders multiply</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Likelihood of rework, refinement, and re-explanation</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Hidden cognitive and governance load</span>
                  </div>
                </div>
              </div>
              </AnimatedSection>

              {/* What MarginMix Is (and Isn't) */}
              <AnimatedSection delay={0.05}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-gray-400 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  What <BrandName /> is and is not
                </h3>
                <div className="space-y-3 mb-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    <XCircle className="h-4 w-4 text-gray-400 inline-block mr-2 align-middle" />
                    <span><BrandName /> is <span className="font-semibold">not</span> a productivity tool.</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <XCircle className="h-4 w-4 text-gray-400 inline-block mr-2 align-middle" />
                    <span>It is <span className="font-semibold">not</span> a time tracking system.</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <XCircle className="h-4 w-4 text-gray-400 inline-block mr-2 align-middle" />
                    <span>It is <span className="font-semibold">not</span> a utilization dashboard.</span>
                  </p>
                </div>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
                  <CheckCircle className="h-5 w-5 inline-block mr-2 align-middle" />
                  <span>It is a decision lens for pricing and margin assurance.</span>
                </p>
              </div>
              </AnimatedSection>

              {/* Outcome for Leaders */}
              <AnimatedSection delay={0.05}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-emerald-500 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Outcome for Leaders
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Clearer pricing decisions</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Fewer surprises mid-delivery</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">More defensible margins without adding process or friction</span>
                  </div>
                </div>
              </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Why MarginMix exists */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <AnimatedSection className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Why <BrandName /> exists
              </h2>
              <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                <BrandName /> is built from lived agency and consulting experience, where margin loss is experienced, not theoretical.
              </p>
              <p className="text-base md:text-lg text-emerald-600 dark:text-emerald-400 font-semibold leading-relaxed">
                It exists to surface economic truth early, while decisions can still be changed.
              </p>
            </div>
            {/* Graphic: flow diagram */}
            <div className="flex flex-col gap-3">
              {[
                { icon: AlertTriangle, color: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", iconColor: "text-red-500", label: "Engagement arrives", sub: "Complexity is unknown. Pricing is gut-feel." },
                { icon: BarChart3, color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", iconColor: "text-amber-500", label: "Structural review", sub: "6 structural dimensions evaluated in minutes." },
                { icon: Shield, color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800", iconColor: "text-emerald-500", label: "Decision clarity", sub: "Proceed, reprice, or restructure before it's too late." },
              ].map((step, i) => (
                <div key={i}>
                  <div className={`flex items-start gap-4 rounded-xl border p-4 ${step.color}`}>
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                      <step.icon className={`h-4 w-4 ${step.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{step.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.sub}</p>
                    </div>
                  </div>
                  {i < 2 && (
                    <div className="flex justify-start ml-8 py-1">
                      <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Final CTA */}
      <section className="relative py-16 sm:py-24 bg-emerald-600 dark:bg-emerald-700 overflow-hidden">
        {/* Background graphic elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        {/* Decorative icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <TrendingUp className="absolute top-8 left-8 h-8 w-8 text-white/10 rotate-12" />
          <Shield className="absolute top-12 right-12 h-10 w-10 text-white/10 -rotate-6" />
          <BarChart3 className="absolute bottom-8 left-1/4 h-8 w-8 text-white/10 rotate-3" />
          <Target className="absolute bottom-10 right-1/4 h-9 w-9 text-white/10 -rotate-12" />
          <Users className="absolute top-1/2 left-6 h-7 w-7 text-white/10" />
          <Zap className="absolute top-1/3 right-8 h-7 w-7 text-white/10 rotate-6" />
        </div>
        <AnimatedSection className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <Shield className="h-4 w-4 text-white" />
              <span className="text-sm text-white font-medium">Deterministic · Proprietary risk logic</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Assess Margin Risk & Price Work Profitably
            </h2>
            <p className="text-emerald-100 mb-8 text-base sm:text-lg">
              Get a clear, structural verdict on any engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="w-full sm:w-auto h-auto sm:h-14 py-3 sm:py-0 text-sm sm:text-lg px-6 sm:px-8 bg-white hover:bg-emerald-50 text-emerald-700 rounded-xl whitespace-normal"
                onClick={() => window.location.href = '/quick-profiler'}
              >
                Try Free Scanner
              </Button>
            </div>
          </div>
        </AnimatedSection>
      </section>

      <Footer />
    </div>
  );
}
