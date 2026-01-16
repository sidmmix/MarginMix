import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import founderPhoto from "@assets/1586921422945_1768559339757.jpeg";

export default function Founder() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex flex-col cursor-pointer">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  MarginMix
                </span>
                <span className="text-xs italic text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Georgia, serif' }}>Margin Risk Clarity</span>
              </div>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Why MarginMix Exists
          </h1>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <p className="text-xl font-medium text-gray-900 dark:text-white">
              Most agencies & consulting firms don't lose margin in a dramatic way.
            </p>

            <div className="space-y-2 text-lg">
              <p>They win work that looks commercially sound.</p>
              <p>The team is busy.</p>
              <p>The client is satisfied.</p>
              <p>Delivery feels under control.</p>
            </div>

            <p>
              And yet, a few months in, margin starts to feel… harder to explain.
            </p>

            <div className="space-y-2">
              <p>Senior leaders are spending more time than expected.</p>
              <p>Conversations multiply.</p>
              <p>Decisions that should be straightforward take longer.</p>
              <p>Small changes accumulate, even when no one is explicitly "scope creeping".</p>
            </div>

            <p>
              None of this feels like failure.<br />
              But somehow, the economics don't add up the way they were meant to.
            </p>

            <p>
              This pattern shows up repeatedly — across retainers, fixed-fee projects, and complex transformation work — and it rarely surfaces early enough to act on.
            </p>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
              The Pattern Behind the Problem
            </h2>

            <p>
              When margin erodes, the conversation usually turns to pricing, utilization, or delivery efficiency.
            </p>

            <p>
              Sometimes those are the issues. Often, they're not.
            </p>

            <p>
              More commonly, margin is being quietly shaped by things that sit outside formal reporting:
            </p>

            <ul className="space-y-3 my-6">
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                <span>How much senior attention an engagement really demands over time</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                <span>How much coordination is required as stakeholders multiply</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                <span>How often work needs to be revisited, refined, or re-explained</span>
              </li>
            </ul>

            <p>
              These pressures don't appear cleanly in timesheets.<br />
              They don't always trigger alarms.<br />
              And by the time they show up in a P&L, they're already embedded in how the work is being done.
            </p>

            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-xl">
              MarginMix exists to make this pattern visible earlier — while there are still decisions to be made.
            </p>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
              The Problem I Kept Seeing
            </h2>

            <p>
              Across large agency networks and consulting-style engagements, margin conversations tend to focus on:
            </p>

            <ul className="space-y-2 my-6">
              <li className="flex items-start gap-3">
                <span className="text-gray-400">•</span>
                <span>Pricing discipline</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gray-400">•</span>
                <span>Utilization targets</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gray-400">•</span>
                <span>Delivery efficiency</span>
              </li>
            </ul>

            <p>
              These matter, but they miss a deeper structural issue: <strong>workforce intensity</strong> — how much senior attention, coordination, and cognitive load an engagement quietly demands over time.
            </p>

            <p>
              This "shadow labor" is rarely tracked formally.<br />
              Yet it is often the single biggest driver of margin erosion.
            </p>

            <p className="font-semibold">
              MarginMix is an attempt to make this visible before it becomes a problem.
            </p>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
              What MarginMix Is (and Isn't)
            </h2>

            <p>
              MarginMix is not a productivity tool.<br />
              It is not a time-tracking system.<br />
              It is not a dashboard designed to optimize utilization.
            </p>

            <p>
              Instead, MarginMix is a <strong>decision lens</strong> — designed to help leaders assess whether work is structurally viable based on how it is likely to be staffed, coordinated, and governed.
            </p>

            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
              The goal is not to optimize people.<br />
              The goal is to make better economic decisions about work.
            </p>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
              Why This Starts as a Founder-Reviewed Assessment
            </h2>

            <p>
              At this stage, MarginMix assessments are personally reviewed by me.
            </p>

            <p>
              That choice is intentional.
            </p>

            <p>
              Before this framework can be encoded into an AI-led system, it needs to be pressure-tested against real organizational context — nuance, politics, delivery realities, and leadership behavior that no automated system can fully capture early on.
            </p>

            <p>This phase is about:</p>

            <ul className="space-y-2 my-6">
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                <span>Validating the decision logic</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                <span>Understanding where judgment matters most</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                <span>Learning where structure breaks down in practice</span>
              </li>
            </ul>

            <p>
              The system will eventually see the light of the day — once the thinking is sound.
            </p>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
              About Me
            </h2>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img 
                src={founderPhoto} 
                alt="Siddhartha Dasgupta (Sid)" 
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-emerald-600 flex-shrink-0"
              />
              <div className="space-y-4">
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  Siddhartha Dasgupta (Sid)
                </p>
                <p>
                  I've spent my career across creative, media, corporate marketing and performance-led environments working with global networks including Dentsu, Ogilvy, Grey, Publicis as well as building and running an independent consultancy.
                </p>
                <p>
                  I've led large accounts, managed cross-market teams, sat in commercial and operational conversations, and been accountable for both growth and profitability.
                </p>
              </div>
            </div>

            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg mt-6">
              MarginMix is not an abstract idea.<br />
              It is a synthesis of patterns observed over years inside the system.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <Link href="/assessment">
              <Button 
                size="lg" 
                className="h-12 sm:h-14 text-sm sm:text-lg px-4 sm:px-8 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                Run a Margin Risk Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </article>
      </main>

      <footer className="bg-gray-900 text-white py-8 sm:py-12 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-400 mb-1">MarginMix</h3>
            <p className="text-xs sm:text-sm italic text-gray-400 mb-4" style={{ fontFamily: 'Georgia, serif' }}>Margin Risk Clarity</p>
            <p className="text-gray-300 mb-6 text-sm sm:text-base">
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
