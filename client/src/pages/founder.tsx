import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Eye, Target, Lightbulb, UserCheck, Building2 } from "lucide-react";
import founderPhoto from "@assets/1586921422945_1768559339757.jpeg";
import advisorPhoto from "@assets/Screenshot_2026-01-21-08-12-37-88_254de13a4bc8758c9908fff1f73e_1768955128744.jpg";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { AnimatedSection } from "@/components/animations";

export default function Founder() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header variant="solid" />

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white py-12 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Why MarginMix Exists
          </h1>
          <p className="text-xl sm:text-2xl text-emerald-100 font-medium">
            Most agencies & consulting firms don't lose margin in a dramatic way.
          </p>
        </div>
      </section>

      {/* The Silent Pattern */}
      <section className="py-12 sm:py-16 bg-white dark:bg-gray-800">
        <AnimatedSection className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <Card className="bg-gray-50 dark:bg-gray-900 border-0">
              <CardContent className="p-6 text-center">
                <p className="text-lg text-gray-700 dark:text-gray-300">They win work that looks commercially sound.</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 dark:bg-gray-900 border-0">
              <CardContent className="p-6 text-center">
                <p className="text-lg text-gray-700 dark:text-gray-300">The team is busy.</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 dark:bg-gray-900 border-0">
              <CardContent className="p-6 text-center">
                <p className="text-lg text-gray-700 dark:text-gray-300">The client is satisfied.</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 dark:bg-gray-900 border-0">
              <CardContent className="p-6 text-center">
                <p className="text-lg text-gray-700 dark:text-gray-300">Delivery feels under control.</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-r-lg mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <p className="font-medium">And yet, a few months in, margin starts to feel… harder to explain.</p>
                <p>Senior leaders are spending more time than expected. Conversations multiply. Decisions that should be straightforward take longer.</p>
                <p className="text-amber-700 dark:text-amber-400 font-semibold">None of this feels like failure. But somehow, the economics don't add up.</p>
              </div>
            </div>
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400 text-center">
            This pattern shows up repeatedly — across retainers, fixed-fee projects, and complex transformation work — and it rarely surfaces early enough to act on.
          </p>
        </AnimatedSection>
      </section>

      {/* The Pattern Behind the Problem */}
      <section className="py-12 sm:py-16 bg-emerald-50 dark:bg-emerald-900/10">
        <AnimatedSection className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              The Pattern Behind the Problem
            </h2>
          </div>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            When margin erodes, the conversation usually turns to pricing, utilization, or delivery efficiency. Sometimes those are the issues. <span className="font-semibold text-emerald-600 dark:text-emerald-400">Often, they're not.</span>
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            More commonly, margin is being quietly shaped by things that sit outside formal reporting:
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">1</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">How much senior attention an engagement really demands over time</p>
            </div>
            <div className="flex items-start gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">2</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">How much coordination is required as stakeholders multiply</p>
            </div>
            <div className="flex items-start gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">3</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">How often work needs to be revisited, refined, or re-explained</p>
            </div>
          </div>

          <Card className="bg-emerald-600 dark:bg-emerald-700 border-0">
            <CardContent className="p-6">
              <p className="text-white text-lg sm:text-xl font-semibold text-center">
                MarginMix exists to make this pattern visible earlier — while there are still decisions to be made.
              </p>
            </CardContent>
          </Card>
        </AnimatedSection>
      </section>

      {/* The Problem I Kept Seeing */}
      <section className="py-12 sm:py-16 bg-white dark:bg-gray-800">
        <AnimatedSection className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gray-900 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              The Problem I Kept Seeing
            </h2>
          </div>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Across large agency networks and consulting-style engagements, margin conversations tend to focus on:
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">Pricing discipline</span>
            <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">Utilization targets</span>
            <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">Delivery efficiency</span>
          </div>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 p-6 rounded-xl mb-6">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              These matter, but they miss a deeper structural issue: <strong className="text-teal-700 dark:text-teal-400">delivery complexities</strong> — how much senior attention, coordination drag, iteration intensity and cognitive load an engagement quietly demands over time.
            </p>
            <p className="text-teal-700 dark:text-teal-400 font-semibold">
              "Delivery Complexity" is rarely tracked formally. Yet it is often the single biggest driver of margin erosion.
            </p>
          </div>

          <p className="text-lg font-semibold text-gray-900 dark:text-white text-center">
            MarginMix is an attempt to make this visible before it becomes a problem.
          </p>
        </AnimatedSection>
      </section>

      {/* What MarginMix Is (and Isn't) */}
      <section className="py-12 sm:py-16 bg-gray-100 dark:bg-gray-900">
        <AnimatedSection className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              What MarginMix Is (and Isn't)
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4 text-center">
                <p className="text-red-600 dark:text-red-400 font-medium">Not a productivity tool</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4 text-center">
                <p className="text-red-600 dark:text-red-400 font-medium">Not a time-tracking system</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4 text-center">
                <p className="text-red-600 dark:text-red-400 font-medium">Not a utilization dashboard</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 mb-6">
            <CardContent className="p-6">
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                Instead, MarginMix is a <strong className="text-emerald-700 dark:text-emerald-400">decision lens</strong> — designed to help leaders assess whether work is structurally viable based on how it is likely to be staffed, coordinated, and governed.
              </p>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-xl text-emerald-600 dark:text-emerald-400 font-semibold">
              The goal is not to optimize people.<br />
              The goal is to make better economic decisions about work.
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* Founder & Key Advisor */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-900 to-emerald-900 text-white">
        <AnimatedSection className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Two column layout on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Founder */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Founder
                </h2>
              </div>

              <div className="flex flex-col items-center sm:items-start gap-6">
                <img 
                  src={founderPhoto} 
                  alt="Siddhartha Dasgupta (Sid)" 
                  className="w-40 h-40 rounded-full object-cover border-4 border-emerald-400 flex-shrink-0 shadow-xl"
                />
                <div className="space-y-4 text-center sm:text-left">
                  <p className="text-2xl font-bold text-emerald-400">
                    Siddhartha Dasgupta (Sid)
                  </p>
                  <p className="text-gray-300">
                    I've spent my career across creative, media, corporate marketing and performance-led environments working with global networks including <span className="text-white font-medium">Dentsu, Ogilvy, Grey, Publicis</span> as well as building and running an independent consultancy.
                  </p>
                  <p className="text-gray-300">
                    I've led large accounts, managed cross-market teams, sat in commercial and operational conversations, and been accountable for both growth and profitability.
                  </p>
                  <p className="text-gray-300">
                  </p>
                </div>
              </div>
            </div>

            {/* Key Advisor */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Key Advisor
                </h2>
              </div>

              <div className="flex flex-col items-center sm:items-start gap-6">
                <img 
                  src={advisorPhoto} 
                  alt="Joy Dasgupta" 
                  className="w-40 h-40 rounded-full object-cover border-4 border-teal-400 flex-shrink-0 shadow-xl"
                />
                <div className="space-y-4 text-center sm:text-left">
                  <p className="text-2xl font-bold text-teal-400">
                    Joy Dasgupta
                  </p>
                  <p className="text-gray-300">
                    Joy is a seasoned enterprise operator who has led large-scale business transformation across global teams at <span className="text-white font-medium">HP, AMEX and Genpact</span>. He brings deep firsthand understanding of margin risk in labor-intensive operating models.
                  </p>
                  <p className="text-gray-300">
                    Based in Boston, Joy is the CEO of gyanAI and advises MarginMix on decision system design, operating-model risk, and enterprise adoption.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-xl text-emerald-400 font-semibold">
              MarginMix is not an abstract idea.<br />
              It is a synthesis of patterns observed over years inside the system.
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-emerald-600">
        <AnimatedSection className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              size="default" 
              className="w-full sm:w-auto h-auto py-3 text-sm sm:text-base px-6 bg-white hover:bg-gray-100 text-emerald-700 rounded-xl font-semibold shadow-lg whitespace-normal"
              onClick={() => window.open('https://calendly.com/sid-marginmix/30min', '_blank')}
            >
              Book Demo
            </Button>
            <Button
              size="default"
              className="w-full sm:w-auto h-auto py-3 text-sm sm:text-base px-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold shadow-lg whitespace-normal"
              onClick={() => window.location.href = '/quick-profiler'}
            >
              Free Delivery Risk Check - 60 seconds!
            </Button>
          </div>
        </AnimatedSection>
      </section>

      <Footer />
    </div>
  );
}
