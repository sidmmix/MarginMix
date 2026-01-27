import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Shield, Gauge, Target, Lightbulb, Scale, Zap } from "lucide-react";
import { Link } from "wouter";

export default function WhyChoose() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-700/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-700/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-100/20 to-teal-100/20 dark:from-emerald-800/10 dark:to-teal-800/10 rounded-full blur-3xl"></div>
      </div>

      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}>
                <div className="flex-shrink-0 flex flex-col cursor-pointer">
                  <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">MarginMix</h1>
                  <span className="text-xs italic text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Georgia, serif' }}>Margin Risk Clarity</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/founder" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}>
                <span className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs sm:text-sm font-medium cursor-pointer">Why MarginMix Exists</span>
              </Link>
              <Link href="/why-choose" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}>
                <span className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs sm:text-sm font-medium cursor-pointer border-b-2 border-emerald-600">Why Choose MarginMix</span>
              </Link>
              <Link href="/" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Why Choose <span className="text-emerald-600 dark:text-emerald-400">MarginMix</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Because pricing risk is decided before delivery begins
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-emerald-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Gauge className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Enterprise systems explain what happened</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                ERPs and dashboards report on the past. MarginMix acts earlier — when work is priced, staffed, and committed.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-amber-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Target className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pricing decisions create variance</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Margin risk is locked in before delivery begins. MarginMix operates at this moment — when pricing assumptions can still be challenged.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-rose-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Why historical data isn't enough</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Timesheets are negotiated. Senior effort is underreported. MarginMix fills the blind spot traditional systems can't address early enough.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Standardized pricing risk evaluation</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                A shared lens to pressure-test pricing, staffing, and coordination risk — creating discipline without bureaucracy.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-violet-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                  <Zap className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Why MarginMix stays lightweight</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                No ERP integrations, timesheets, or cost tables required. Designed to be used every time pricing is discussed.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-emerald-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pricing clarity doesn't require perfect data</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Early warning and defensible decisions. Repricing even one engagement can protect hundreds of thousands in margin.
              </p>
            </div>
          </div>

          </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-emerald-600 dark:bg-emerald-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
              Assess Margin risk & Price work appropriately!
            </h2>
            <Link href="/assessment" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}>
              <Button 
                size="lg" 
                className="h-12 sm:h-14 text-sm sm:text-lg px-4 sm:px-8 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
              >
                Run a Margin Risk Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-emerald-100 mt-4 text-sm">
              Early access assessments are reviewed for fit.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-emerald-400 mb-1">MarginMix</h3>
            <p className="text-sm italic text-gray-400 mb-4" style={{ fontFamily: 'Georgia, serif' }}>Margin Risk Clarity</p>
            <p className="text-gray-300 mb-6 mt-4">
              MarginMix is a decision system for margin governance — not a delivery or productivity platform.
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
