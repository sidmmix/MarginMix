import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle, Users, Building2, Briefcase, Target, Shield, TrendingUp, BarChart3, Zap } from "lucide-react";
import { Link } from "wouter";
import { Header } from "@/components/header";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-700/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-700/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-100/20 to-teal-100/20 dark:from-emerald-800/10 dark:to-teal-800/10 rounded-full blur-3xl"></div>
      </div>

      <Header />

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-14 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 leading-tight lg:whitespace-nowrap">
              Predict Margin Risk for Every Account/Campaign/Project — Before Delivery
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 mx-auto leading-relaxed sm:whitespace-nowrap">
              MarginMix is a deterministic pricing and margin decision engine
            </p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 mx-auto leading-relaxed sm:whitespace-nowrap">
              Every commercial decision has a margin risk moment. MarginMix finds it before it costs you. 
            </p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 mx-auto leading-relaxed sm:whitespace-nowrap">
              AI is reshaping how work gets delivered. Most pricing models haven't caught up.
            </p>
            <p className="text-sm sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 px-2 sm:px-0">
              Works across all commercial models: Time & Materials · Fixed Price · Outcome-based · Hybrid engagements
            </p>
            <Button 
              size="lg" 
              className="w-full sm:w-auto h-auto sm:h-14 py-3 sm:py-0 text-sm sm:text-lg px-5 sm:px-8 bg-emerald-600 hover:bg-emerald-700 rounded-xl whitespace-normal"
              data-testid="button-cta-hero"
              onClick={() => window.open('https://calendly.com/sid-marginmix/30min', '_blank')}
            >
              Book Demo
            </Button>
            <p className="mt-5 sm:mt-6 text-lg sm:text-xl font-bold text-gray-900 dark:text-white px-2 sm:px-0">
              MarginMix is a decision infrastructure for{" "}
              <span className="text-emerald-600 dark:text-emerald-400">pricing & margin risk - </span>
              <span className="text-red-600 dark:text-red-400">not a productivity tool!</span>
            </p>
            <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400 px-2 sm:px-0 tracking-wide">
              Lightweight <span className="text-emerald-500 mx-1">›</span> Interactive <span className="text-emerald-500 mx-1">›</span> Insightful <span className="text-emerald-500 mx-1">›</span> API enabled
            </p>
          </div>
        </div>
      </section>

      {/* Margin Gap Statement */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="italic text-gray-500 dark:text-gray-400 text-base sm:text-lg leading-relaxed mb-4">
            "Agencies benchmark 18–20% EBITDA. Most realize 13% or less. For a $25M agency, that gap is worth over $1.5M a year — not lost to bad clients, but to delivery complexity that was never priced in."
          </p>
          <p className="text-lg sm:text-xl font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
            MarginMix helps you plug that gap!
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Figures derived from publicly available data
          </p>
        </div>
      </section>

      {/* Pre vs Post MarginMix */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">Pre MarginMix</h3>
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
              <h3 className="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-6">Post MarginMix</h3>
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
        </div>
      </section>

      {/* What MarginMix Does */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              What MarginMix Does
            </h2>
            <p className="text-base md:text-xl text-gray-700 dark:text-gray-300 mb-12 text-center max-w-3xl mx-auto">
              MarginMix acts as a pricing and margin assurance layer. It evaluates whether work is structurally viable based on how it will actually be staffed, governed, and reviewed — not how it looks on paper.
            </p>
            
            <div className="space-y-10">
              {/* What We Measure */}
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

              {/* What MarginMix Is (and Isn't) */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-gray-400 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  What MarginMix Is (and Isn't)
                </h3>
                <div className="space-y-3 mb-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    <XCircle className="h-4 w-4 text-gray-400 inline-block mr-2 align-middle" />
                    <span>MarginMix is <span className="font-semibold">not</span> a productivity tool.</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <XCircle className="h-4 w-4 text-gray-400 inline-block mr-2 align-middle" />
                    <span>It is <span className="font-semibold">not</span> a time-tracking system.</span>
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

              {/* Outcome for Leaders */}
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
                    <span className="text-gray-700 dark:text-gray-300 font-medium">More defensible margins — without adding process or friction</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who this is designed for */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Who this is designed for
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-6 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Designed for:
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 dark:text-gray-300">Agencies & Consulting firms</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 dark:text-gray-300">CEOs, CFOs, COOs, Managing Partners, and Client Leads</span>
                </li>
                <li className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 dark:text-gray-300">Firms where margin decisions are rarely supported by reliable data</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
                <XCircle className="h-6 w-6" />
                Not designed for:
              </h3>
              <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="text-gray-400">•</span>
                  <span>Small teams where founders still see everything</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400">•</span>
                  <span>Productivity tracking or utilization management</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400">•</span>
                  <span>Delivery optimization, task management, or dashboards</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How the Margin Risk Assessment works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            How the Margin Risk Assessment works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg">
                You describe the intended structure & delivery complexity of an engagement objectively
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg">
                MarginMix analyzes your inputs
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg">
                You receive a clear margin-risk verdict with decision guidance
              </p>
            </div>
          </div>
          <p className="text-center text-emerald-600 dark:text-emerald-400 mt-8 text-base md:text-lg font-bold">
            This is an assessment of economic viability — not a delivery forecast.
          </p>
        </div>
      </section>

      {/* Example Verdicts */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 text-center">
            What MarginMix tells you
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-12 text-sm sm:text-base">
            Real verdict scenarios from the decision engine — every output is deterministic, not AI-generated
          </p>

          <div className="space-y-6 max-w-5xl mx-auto">

            {/* Verdict 1: Structurally Safe */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden">
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
            </div>

            {/* Verdict 2: Price Sensitive */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden">
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
            </div>

            {/* Verdict 3: Structurally Fragile */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden">
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
            </div>

            {/* Verdict 4: Do Not Proceed Without Repricing */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden">
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
            </div>

          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
            These are illustrative scenarios showing actual verdict types from the MarginMix decision engine
          </p>
        </div>
      </section>

      {/* Why MarginMix exists */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Why MarginMix exists
            </h2>
            <p className="text-base md:text-xl text-gray-700 dark:text-gray-300 mb-6">
              MarginMix is built from lived agency and consulting experience — where margin loss isn't theoretical, it's experienced.
            </p>
            <p className="text-base md:text-xl text-emerald-600 dark:text-emerald-400 font-semibold">
              It exists to surface economic truth early, while decisions can still be changed.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-20 bg-emerald-600 dark:bg-emerald-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
              Assess Margin Risk & Price work Profitably!
            </h2>
            <Button 
              size="lg" 
              className="w-full sm:w-auto h-auto sm:h-14 py-3 sm:py-0 text-sm sm:text-lg px-4 sm:px-8 bg-gray-900 hover:bg-gray-800 text-white rounded-xl whitespace-normal"
              data-testid="button-cta-footer"
              onClick={() => window.open('https://calendly.com/sid-marginmix/30min', '_blank')}
            >
              Book Demo
            </Button>
            <p className="text-emerald-100 mt-4 text-sm">
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-emerald-400 mb-1">MarginMix</h3>
            <p className="text-sm italic text-gray-400 mb-4" style={{ fontFamily: 'Georgia, serif' }}>Margin Risk Clarity</p>
            <p className="text-gray-300 mb-6 mt-4">
              MarginMix is a decision system for margin governance — not a delivery or productivity platform.
            </p>
            <p className="text-gray-300 mb-6">
              Contact: <a href="mailto:sid@marginmix.ai" className="text-emerald-400 hover:text-emerald-300">sid@marginmix.ai</a> <a href="tel:+16286001309" className="text-emerald-400 hover:text-emerald-300">+1.628.600.1309</a>
            </p>
            <p className="text-gray-400 text-sm mb-2">
              MarginMix is a Digital Lexicon Corp brand.
            </p>
            <p className="text-gray-400 text-sm mb-2">
              Digital Lexicon, Delaware, DE
            </p>
            <p className="text-gray-400 text-sm">
              © 2026 Digital Lexicon. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
