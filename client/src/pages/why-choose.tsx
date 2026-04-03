import { Shield, Gauge, Target, Lightbulb, Scale, Zap } from "lucide-react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { AnimatedSection, MotionButton } from "@/components/animations";
import { staggerContainer, staggerItem } from "@/components/motion-variants";
import { motion, useReducedMotion } from "framer-motion";

const cards = [
  {
    color: "border-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    Icon: Gauge,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    title: "Enterprise systems explain what happened",
    body: "ERPs and dashboards report on the past. MarginMix acts earlier — when work is priced, staffed, and committed.",
  },
  {
    color: "border-amber-500",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    Icon: Target,
    iconColor: "text-amber-600 dark:text-amber-400",
    title: "Pricing decisions create variance",
    body: "Margin risk is locked in before delivery begins. MarginMix operates at this moment — when pricing assumptions can still be challenged.",
  },
  {
    color: "border-rose-500",
    iconBg: "bg-rose-100 dark:bg-rose-900/30",
    Icon: Lightbulb,
    iconColor: "text-rose-600 dark:text-rose-400",
    title: "Why historical data isn't enough",
    body: "Timesheets are negotiated. Senior effort is underreported. MarginMix fills the blind spot traditional systems can't address early enough.",
  },
  {
    color: "border-blue-500",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    Icon: Scale,
    iconColor: "text-blue-600 dark:text-blue-400",
    title: "Standardized pricing risk evaluation",
    body: "A shared lens to pressure-test pricing, staffing, and coordination risk — creating discipline without bureaucracy.",
  },
  {
    color: "border-violet-500",
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    Icon: Zap,
    iconColor: "text-violet-600 dark:text-violet-400",
    title: "MarginMix stays lightweight",
    body: "No ERP integrations, timesheets, or cost tables required. Designed to be used every time pricing is discussed.",
  },
  {
    color: "border-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    Icon: Shield,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    title: "Pricing clarity doesn't require perfect data",
    body: "Early warning and defensible decisions. Repricing even one engagement can protect hundreds of thousands in margin.",
  },
];

export default function WhyChoose() {
  const shouldReduce = useReducedMotion();
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-700/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-700/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-100/20 to-teal-100/20 dark:from-emerald-800/10 dark:to-teal-800/10 rounded-full blur-3xl"></div>
      </div>

      <Header />

      <div className="h-16"></div>

      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Why Choose <span className="text-emerald-600 dark:text-emerald-400">MarginMix</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            </p>
          </AnimatedSection>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
            variants={shouldReduce ? undefined : staggerContainer}
            initial={shouldReduce ? undefined : "hidden"}
            whileInView={shouldReduce ? undefined : "show"}
            viewport={{ once: true, margin: "-80px" }}
          >
            {cards.map((c, i) => (
              <motion.div
                key={i}
                variants={shouldReduce ? undefined : staggerItem}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-8 border-l-4 ${c.color} shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 ${c.iconBg} rounded-lg`}>
                    <c.Icon className={`h-6 w-6 ${c.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{c.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{c.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 sm:py-20 bg-emerald-600 dark:bg-emerald-700">
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
              Assess Margin Risk & Price work Profitably!
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <MotionButton
                size="lg"
                className="w-full sm:w-auto h-auto sm:h-14 py-3 sm:py-0 text-sm sm:text-lg px-4 sm:px-8 bg-gray-900 hover:bg-gray-800 text-white rounded-xl whitespace-normal"
                onClick={() => window.open('https://calendly.com/sid-marginmix/30min', '_blank')}
              >
                Book Demo
              </MotionButton>
              <MotionButton
                size="lg"
                className="w-full sm:w-auto h-auto sm:h-14 py-3 sm:py-0 text-sm sm:text-lg px-4 sm:px-8 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl whitespace-normal"
                onClick={() => window.location.href = '/quick-profiler'}
              >
                Free Delivery Risk Check - 60 seconds!
              </MotionButton>
            </div>
            <p className="text-emerald-100 mt-4 text-sm">
            </p>
          </div>
        </AnimatedSection>
      </section>

      <Footer />
    </div>
  );
}
