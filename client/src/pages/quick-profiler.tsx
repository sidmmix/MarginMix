import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowDown, ArrowUp, ArrowLeft, Zap, AlertTriangle, ShieldCheck, ShieldAlert, Shield, ChevronRight, ChevronDown, Check, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PROFILER_STORAGE_KEY = "marginmix_profiler_answers";

interface ProfilerQuestion {
  id: string;
  fieldKey: string;
  number: number;
  title: string;
  subtitle?: string;
  context?: string;
  section: string;
  sectionColor: string;
  options: { value: string; label: string }[];
  riskMapping: Record<string, "low" | "medium" | "high">;
}

const profilerQuestions: ProfilerQuestion[] = [
  {
    id: "q1",
    fieldKey: "decisionEvaluating",
    number: 1,
    title: "What decision are you evaluating with this assessment?",
    context: "The type of decision shapes how much pricing flexibility remains.",
    section: "Context",
    sectionColor: "emerald",
    options: [
      { value: "new-client-win", label: "New client win / pitch acceptance" },
      { value: "renewal-extension", label: "Renewal / contract extension" },
      { value: "scope-expansion", label: "Scope expansion without repricing" },
      { value: "escalation", label: "Escalation on a live account" },
      { value: "strategic-exception", label: "Strategic / leadership-driven exception" },
      { value: "exploratory", label: "Exploratory / no active decision" }
    ],
    riskMapping: {
      "new-client-win": "low",
      "renewal-extension": "low",
      "scope-expansion": "high",
      "escalation": "high",
      "strategic-exception": "medium",
      "exploratory": "low"
    }
  },
  {
    id: "q2",
    fieldKey: "engagementClassification",
    number: 2,
    title: "How would you classify this engagement today?",
    context: "Engagement maturity affects how predictable the delivery effort will be.",
    section: "Context",
    sectionColor: "emerald",
    options: [
      { value: "new", label: "New (pre-kickoff / onboarding phase)" },
      { value: "ongoing-less-6", label: "Ongoing (in delivery for less than 6 months)" },
      { value: "ongoing-6-12", label: "Ongoing (in delivery for 6–12 months)" },
      { value: "ongoing-12-plus", label: "Ongoing (in delivery for 12+ months)" },
      { value: "renewal-expansion", label: "Renewal / scope expansion of an existing engagement" }
    ],
    riskMapping: {
      "new": "medium",
      "ongoing-less-6": "medium",
      "ongoing-6-12": "low",
      "ongoing-12-plus": "low",
      "renewal-expansion": "medium"
    }
  },
  {
    id: "q3",
    fieldKey: "clientVolatility",
    number: 3,
    title: "How would you rate client volatility?",
    context: "Client stability directly impacts coordination cost and rework risk.",
    section: "Workforce Intensity",
    sectionColor: "teal",
    options: [
      { value: "low", label: "Low (stable stakeholders, clear expectations)" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High (frequent changes, multiple decision-makers)" }
    ],
    riskMapping: {
      "low": "low",
      "medium": "medium",
      "high": "high"
    }
  },
  {
    id: "q4",
    fieldKey: "seniorLeadershipInvolvement",
    number: 4,
    title: "What's the planned senior leadership involvement?",
    context: "Senior time is the most expensive resource — its draw shapes margin.",
    section: "Workforce Intensity",
    sectionColor: "teal",
    options: [
      { value: "minimal", label: "Minimal (oversight only)" },
      { value: "periodic", label: "Periodic (key moments)" },
      { value: "frequent", label: "Frequent (ongoing)" },
      { value: "continuous", label: "Continuous (embedded)" }
    ],
    riskMapping: {
      "minimal": "low",
      "periodic": "medium",
      "frequent": "high",
      "continuous": "high"
    }
  },
  {
    id: "q5",
    fieldKey: "executionThinkingMix",
    number: 5,
    title: "What's the execution vs thinking mix?",
    context: "Thinking-heavy work is harder to scope, price, and delegate.",
    section: "Effort & Delivery",
    sectionColor: "cyan",
    options: [
      { value: "execution-heavy", label: "Execution-heavy" },
      { value: "balanced", label: "Balanced" },
      { value: "thinking-heavy", label: "Thinking-heavy" }
    ],
    riskMapping: {
      "execution-heavy": "low",
      "balanced": "medium",
      "thinking-heavy": "high"
    }
  },
  {
    id: "q6",
    fieldKey: "aiEffortShift",
    number: 6,
    title: "Where is AI primarily expected to substitute effort?",
    context: "The layer where AI replaces human effort determines whether it reduces cost or increases oversight burden.",
    section: "AI Impact",
    sectionColor: "amber",
    options: [
      { value: "junior_execution", label: "Junior execution" },
      { value: "mid_level_production", label: "Mid-level production" },
      { value: "senior_thinking_review", label: "Senior thinking / review" },
      { value: "no_clear_substitution", label: "No clear substitution" }
    ],
    riskMapping: {
      "junior_execution": "low",
      "mid_level_production": "medium",
      "senior_thinking_review": "high",
      "no_clear_substitution": "high"
    }
  }
];

type RiskLevel = "none" | "low" | "moderate" | "elevated" | "high" | "critical";

interface RiskState {
  level: RiskLevel;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof ShieldCheck;
  percentage: number;
}

type Level = "low" | "medium" | "high";
type Verdict = "Structurally Safe" | "Price Sensitive" | "Execution Heavy" | "Structurally Fragile" | "Do Not Proceed Without Repricing";

function deriveSignals(answers: Record<string, string>) {
  const seniorInvolvement = answers["q4"] || "";
  const seniorDependency: Level =
    seniorInvolvement === "frequent" || seniorInvolvement === "continuous" ? "high" :
    seniorInvolvement === "periodic" ? "medium" : "low";

  const clientVol = answers["q3"] || "";
  const clientVolatility: Level =
    clientVol === "high" ? "high" :
    clientVol === "medium" ? "medium" : "low";

  const execMix = answers["q5"] || "";
  const teamMaturity: Level =
    execMix === "execution-heavy" ? "high" :
    execMix === "balanced" ? "medium" : "low";

  const aiShift = answers["q6"] || "";
  const aiEffortShift: Level =
    aiShift === "junior_execution" ? "low" :
    aiShift === "mid_level_production" ? "medium" :
    aiShift === "senior_thinking_review" || aiShift === "no_clear_substitution" ? "high" : "medium";

  const decisionType = answers["q1"] || "";
  const decisionRisk: Level =
    decisionType === "scope-expansion" || decisionType === "escalation" ? "high" :
    decisionType === "strategic-exception" || decisionType === "renewal-extension" ? "medium" : "low";

  const engagementClass = answers["q2"] || "";
  const engagementMaturity: Level =
    engagementClass === "new" || engagementClass === "ongoing-less-6" ? "medium" :
    engagementClass === "renewal-expansion" ? "medium" : "low";

  return { seniorDependency, clientVolatility, teamMaturity, aiEffortShift, decisionRisk, engagementMaturity };
}

interface QuickDimensions {
  workforceIntensity: Level;
  coordinationEntropy: Level;
  commercialExposure: Level;
  volatilityControl: Level;
  aiExposure: Level;
  measurementMaturity: Level;
}

function deriveDimensions(signals: ReturnType<typeof deriveSignals>): QuickDimensions {
  const workforceIntensity: Level =
    signals.seniorDependency === "high" ? "high" :
    signals.seniorDependency === "medium" ? "medium" : "low";

  const coordinationEntropy: Level =
    signals.clientVolatility === "high" && signals.seniorDependency !== "low" ? "high" :
    signals.clientVolatility === "high" || signals.engagementMaturity === "medium" ? "medium" : "low";

  const commercialExposure: Level =
    signals.decisionRisk === "high" ? "high" :
    signals.decisionRisk === "medium" || signals.teamMaturity === "low" ? "medium" : "low";

  const volatilityControl: Level =
    signals.clientVolatility === "high" ? "high" :
    signals.clientVolatility === "medium" ? "medium" : "low";

  const aiExposure: Level =
    signals.aiEffortShift === "high" ? "high" :
    signals.aiEffortShift === "medium" ? "medium" : "low";

  const measurementMaturity: Level =
    signals.teamMaturity === "high" ? "high" :
    signals.teamMaturity === "medium" ? "medium" : "low";

  return { workforceIntensity, coordinationEntropy, commercialExposure, volatilityControl, aiExposure, measurementMaturity };
}

function decideVerdict(dims: QuickDimensions): { verdict: Verdict; reason: string } {
  if (dims.aiExposure === "high" && dims.workforceIntensity === "high") {
    return {
      verdict: "Do Not Proceed Without Repricing",
      reason: "AI is expected to substitute at the senior or unclear level while workforce intensity is high. This combination creates unsustainable cost pressure — engagement requires repricing or structural changes."
    };
  }
  if (dims.workforceIntensity === "high" && dims.coordinationEntropy === "high") {
    return {
      verdict: "Structurally Fragile",
      reason: "Structural load exceeds safe operating assumptions. High workforce intensity combined with high coordination entropy creates unsustainable margin pressure."
    };
  }
  if (dims.commercialExposure === "high") {
    return {
      verdict: "Price Sensitive",
      reason: "Pricing assumptions require protection. High scope elasticity or pricing rigidity creates commercial vulnerability."
    };
  }
  if (dims.workforceIntensity === "high" || dims.aiExposure === "high") {
    return {
      verdict: "Execution Heavy",
      reason: "Execution and coordination will dominate effort. Senior dependency, AI oversight burden, or iteration load require elevated management attention."
    };
  }
  return {
    verdict: "Structurally Safe",
    reason: "Engagement viable under stated assumptions. No high-risk conditions triggered. Proceed with standard governance."
  };
}

const verdictToRisk: Record<Verdict, Omit<RiskState, 'percentage'>> = {
  "Do Not Proceed Without Repricing": { level: "critical", label: "Do Not Proceed Without Repricing", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-500", icon: ShieldAlert },
  "Structurally Fragile": { level: "high", label: "Structurally Fragile", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-400", icon: AlertTriangle },
  "Execution Heavy": { level: "elevated", label: "Execution Heavy", color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-400", icon: AlertTriangle },
  "Price Sensitive": { level: "moderate", label: "Price Sensitive", color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-400", icon: Shield },
  "Structurally Safe": { level: "low", label: "Structurally Safe", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-400", icon: ShieldCheck },
};

const verdictPercentage: Record<Verdict, number> = {
  "Do Not Proceed Without Repricing": 100,
  "Structurally Fragile": 85,
  "Execution Heavy": 65,
  "Price Sensitive": 45,
  "Structurally Safe": 15,
};

function computeRisk(answers: Record<string, string>): RiskState {
  const answeredQuestions = profilerQuestions.filter(q => answers[q.id]);
  if (answeredQuestions.length === 0) {
    return { level: "none", label: "Awaiting Input", color: "text-gray-400", bgColor: "bg-gray-100", borderColor: "border-gray-300", icon: Shield, percentage: 0 };
  }

  const signals = deriveSignals(answers);
  const dimensions = deriveDimensions(signals);
  const { verdict } = decideVerdict(dimensions);
  const riskStyle = verdictToRisk[verdict];

  return { ...riskStyle, percentage: verdictPercentage[verdict] };
}

function levelToWeight(level: Level): number {
  if (level === "low") return 0;
  if (level === "medium") return 0.5;
  return 1;
}


function calculateMarginImpact(verdict: Verdict, currentMargin: number, dimensions: QuickDimensions): { estimatedLoss: number; effectiveMargin: number; impactLabel: string; impactColor: string } {
  const ranges: Record<Verdict, [number, number]> = {
    "Structurally Safe": [0, 3],
    "Execution Heavy": [3, 8],
    "Price Sensitive": [5, 12],
    "Structurally Fragile": [10, 18],
    "Do Not Proceed Without Repricing": [15, 25],
  };
  const [min, max] = ranges[verdict] || [0, 3];

  const dimensionWeights = [
    levelToWeight(dimensions.workforceIntensity),
    levelToWeight(dimensions.coordinationEntropy),
    levelToWeight(dimensions.commercialExposure),
    levelToWeight(dimensions.volatilityControl),
    levelToWeight(dimensions.aiExposure),
    levelToWeight(dimensions.measurementMaturity),
  ];
  const avgWeight = dimensionWeights.reduce((a, b) => a + b, 0) / dimensionWeights.length;

  const estimatedLoss = Math.round((min + (max - min) * avgWeight) * 10) / 10;
  const effectiveMargin = Math.max(Math.round((currentMargin - estimatedLoss) * 10) / 10, 0);

  let impactLabel: string;
  let impactColor: string;
  if (estimatedLoss <= 1) { impactLabel = "No Impact"; impactColor = "emerald"; }
  else if (estimatedLoss <= 4) { impactLabel = "Minimal Impact"; impactColor = "emerald"; }
  else if (estimatedLoss <= 8) { impactLabel = "Moderate Impact"; impactColor = "amber"; }
  else if (estimatedLoss <= 15) { impactLabel = "Significant Impact"; impactColor = "red"; }
  else { impactLabel = "Severe Impact"; impactColor = "red"; }

  return { estimatedLoss, effectiveMargin, impactLabel, impactColor };
}

function getHeatmapColor(risk: "low" | "medium" | "high"): string {
  if (risk === "high") return "bg-red-500";
  if (risk === "medium") return "bg-amber-400";
  return "bg-emerald-500";
}

function getHeatmapGlow(risk: "low" | "medium" | "high"): string {
  if (risk === "high") return "shadow-red-500/40";
  if (risk === "medium") return "shadow-amber-400/40";
  return "shadow-emerald-500/40";
}

const sectionGradients: Record<string, string> = {
  emerald: "from-emerald-600 via-emerald-500 to-teal-500",
  teal: "from-teal-600 via-teal-500 to-cyan-500",
  cyan: "from-cyan-600 via-cyan-500 to-sky-500",
  amber: "from-amber-600 via-amber-500 to-orange-500",
};

export default function QuickProfiler() {
  const [currentQuestion, setCurrentQuestion] = useState(-2);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentMargin, setCurrentMargin] = useState<string>("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const totalQuestions = profilerQuestions.length;
  const isIntro = currentQuestion === -2;
  const isMarginQuestion = currentQuestion === -1;

  const risk = computeRisk(answers);

  const scrollToQuestion = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    if (index > totalQuestions - 1 && Object.keys(answers).length === totalQuestions) {
      setShowResult(true);
    }
    setCurrentQuestion(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleOptionSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setTimeout(() => {
      const currentIdx = profilerQuestions.findIndex(q => q.id === questionId);
      if (currentIdx < totalQuestions - 1) {
        scrollToQuestion(currentIdx + 1);
      } else {
        setShowResult(true);
        scrollToQuestion(totalQuestions);
      }
    }, 350);
  };

  const handleNext = () => {
    if (isIntro) {
      scrollToQuestion(-1);
      return;
    }
    if (isMarginQuestion) {
      const parsed = Number(currentMargin);
      if (!currentMargin || !Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
        toast({ title: "Please enter a valid margin % (between 0 and 100) to continue.", variant: "destructive" });
        return;
      }
      scrollToQuestion(0);
      return;
    }
    if (currentQuestion >= 0 && currentQuestion < totalQuestions) {
      if (!answers[profilerQuestions[currentQuestion].id]) {
        toast({ title: "Please answer before proceeding.", variant: "destructive" });
        return;
      }
      if (currentQuestion < totalQuestions - 1) {
        scrollToQuestion(currentQuestion + 1);
      } else {
        setShowResult(true);
        scrollToQuestion(totalQuestions);
      }
    }
  };

  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
      scrollToQuestion(totalQuestions - 1);
      return;
    }
    if (currentQuestion > 0) {
      scrollToQuestion(currentQuestion - 1);
    } else if (currentQuestion === 0) {
      scrollToQuestion(-1);
    } else if (isMarginQuestion) {
      scrollToQuestion(-2);
    }
  };

  const handleGoToFullAssessment = () => {
    const profilerData: Record<string, string> = {};
    for (const q of profilerQuestions) {
      if (answers[q.id]) {
        profilerData[q.fieldKey] = answers[q.id];
      }
    }
    if (currentMargin) {
      profilerData._currentMargin = currentMargin;
    }
    localStorage.setItem(PROFILER_STORAGE_KEY, JSON.stringify(profilerData));
    setLocation("/assessment?from=profiler");
  };

  const isCurrentQuestionAnswered = () => {
    if (currentQuestion < 0 || currentQuestion >= totalQuestions) return true;
    return !!answers[profilerQuestions[currentQuestion].id];
  };

  useEffect(() => {
    let lastScrollTime = 0;
    const scrollThrottle = 800;

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime < scrollThrottle) return;
      if (isTransitioning) return;
      if (showResult) return;

      if (e.deltaY > 50) {
        if (!isCurrentQuestionAnswered()) {
          lastScrollTime = now;
          toast({ title: "Please answer before proceeding.", variant: "destructive" });
          return;
        }
        lastScrollTime = now;
        handleNext();
      } else if (e.deltaY < -50) {
        lastScrollTime = now;
        handleBack();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: true });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [currentQuestion, isIntro, isMarginQuestion, currentMargin, isTransitioning, showResult, answers, totalQuestions]);

  useEffect(() => {
    let touchStartY = 0;
    const minSwipeDistance = 50;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isTransitioning || showResult) return;
      const touchEndY = e.changedTouches[0].clientY;
      const swipeDistance = touchStartY - touchEndY;

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          if (!isCurrentQuestionAnswered()) {
            toast({ title: "Please answer before proceeding.", variant: "destructive" });
            return;
          }
          handleNext();
        } else {
          handleBack();
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [currentQuestion, isIntro, isMarginQuestion, currentMargin, isTransitioning, showResult, answers, totalQuestions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning || showResult) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, isIntro, isMarginQuestion, currentMargin, isTransitioning, showResult, answers]);

  const calculateProgress = () => {
    if (showResult) return 100;
    if (isIntro) return 0;
    return Math.round(((currentQuestion + 1) / (totalQuestions + 1)) * 100);
  };

  const renderHeatmap = () => {
    return (
      <div className="flex items-center gap-1 sm:gap-1.5">
        {profilerQuestions.map((q, idx) => {
          const answer = answers[q.id];
          const riskLevel = answer ? q.riskMapping[answer] : null;
          const isActive = idx === currentQuestion;
          const isAnswered = !!answer;

          return (
            <div
              key={q.id}
              className={`
                w-5 h-5 sm:w-8 sm:h-8 rounded-md flex items-center justify-center text-[9px] sm:text-xs font-bold transition-all duration-500
                ${isAnswered && riskLevel ? `${getHeatmapColor(riskLevel)} text-white shadow-md ${getHeatmapGlow(riskLevel)}` : ''}
                ${!isAnswered && isActive ? 'bg-white/30 text-white/80 ring-2 ring-white/60 animate-pulse' : ''}
                ${!isAnswered && !isActive ? 'bg-white/10 text-white/40' : ''}
              `}
            >
              {q.number}
            </div>
          );
        })}
      </div>
    );
  };

  const renderRiskBadge = () => {
    if (risk.level === "none") return null;
    const RiskIcon = risk.icon;
    return (
      <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
        <RiskIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
        <span className="text-[10px] sm:text-xs font-semibold text-white">{risk.label}</span>
      </div>
    );
  };

  const renderIntro = () => {
    if (!isIntro || showResult) return null;

    return (
      <div className="absolute inset-0 z-30">
        <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-2xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full mb-6">
              <Zap className="h-5 w-5 text-white" />
              <span className="text-sm font-semibold text-white">1 Minute Risk Check</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4">
              Quick Margin Risk Profiler
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-emerald-100 mb-4 sm:mb-8 italic" style={{ fontFamily: 'Georgia, serif' }}>
              Margin Risk Clarity
            </p>

            <p className="text-sm sm:text-base md:text-lg text-emerald-50 mb-6 sm:mb-10 leading-relaxed max-w-xl mx-auto px-2">
              Answer 6 rapid-fire questions. Watch your risk heatmap build in real time.
              Get an instant margin risk indication before committing to the full assessment.
            </p>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-6 mb-6 sm:mb-8 text-emerald-100 text-xs sm:text-base">
              <div className="flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>6 questions</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>~60 seconds</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Instant risk indication</span>
              </div>
            </div>

            <Button
              onClick={() => scrollToQuestion(-1)}
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 px-6 sm:px-12 py-4 sm:py-7 text-base sm:text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              Start Risk Check
              <ArrowDown className="ml-2 sm:ml-3 h-4 w-4 sm:h-6 sm:w-6" />
            </Button>

            <p className="mt-8 sm:mt-10 text-xs sm:text-sm text-emerald-200/80 px-4">
              No financial data or timesheets required.
            </p>
          </div>

          <div className="absolute bottom-4 sm:bottom-8 animate-bounce">
            <ChevronDown className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-200/60" />
          </div>
        </div>
      </div>
    );
  };

  const renderMarginQuestion = () => {
    const isActive = isMarginQuestion && !showResult;
    if (!isActive && !isIntro) return null;

    return (
      <div
        className={`absolute inset-0 z-20 overflow-y-auto ${isActive ? "" : "pointer-events-none opacity-0"}`}
      >
        <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 flex flex-col">
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-16 sm:pt-20 pb-28 sm:pb-20">
            <div
              className={`w-full max-w-2xl transition-all duration-500 ${
                isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: isActive ? "150ms" : "0ms" }}
            >
              <div className="mb-4 sm:mb-6">
                <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                  Margin Qualifier
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-2 sm:mb-3">
                What's the current margin of the project/client/group of clients you are evaluating?
              </h2>

              <p className="text-sm sm:text-base text-white/50 italic mb-3 sm:mb-4">
                Indicative required, if not actual
              </p>

              <p className="text-base sm:text-xl text-white/80 mb-6 sm:mb-8">
                Enter your margin % to see estimated impact on your results <span className="text-red-300">*</span>
              </p>

              <div className="w-full max-w-md mx-auto">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={currentMargin}
                    onChange={(e) => setCurrentMargin(e.target.value)}
                    placeholder="e.g. 18"
                    className="text-center text-2xl sm:text-3xl py-5 sm:py-6 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white placeholder:text-white/40 focus:border-white focus:bg-white/20 rounded-xl pr-14"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/60 text-2xl font-medium">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 bg-black/30 backdrop-blur-md border-t border-white/10">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm sm:text-base"
            >
              <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-emerald-700 rounded-full font-semibold hover:bg-emerald-50 transition-all text-sm sm:text-base shadow-lg"
              >
                Continue
                <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCard = (questionIndex: number) => {
    const question = profilerQuestions[questionIndex];
    const isActive = currentQuestion === questionIndex && !showResult;

    const distance = Math.abs(questionIndex - currentQuestion);
    if (distance > 1 && !isIntro && !isMarginQuestion && !showResult) return null;

    const gradient = sectionGradients[question.sectionColor] || sectionGradients.emerald;
    const currentValue = answers[question.id] || "";

    return (
      <div
        key={question.id}
        className={`absolute inset-0 z-20 overflow-y-auto ${isActive ? "" : "pointer-events-none opacity-0"}`}
      >
        <div className={`min-h-screen bg-gradient-to-br ${gradient} flex flex-col`}>
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-16 sm:pt-20 pb-28 sm:pb-20">
            <div
              className={`w-full max-w-2xl transition-all duration-500 ${
                isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: isActive ? "150ms" : "0ms" }}
            >
              <div className="mb-4 sm:mb-6">
                <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                  {question.section}
                </span>
                <div className="text-white/70 text-sm sm:text-lg font-medium">
                  Question {question.number} of {totalQuestions}
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 sm:mb-4">
                {question.title}
              </h2>

              {question.subtitle && (
                <p className="text-base sm:text-xl text-white/80 mb-3 sm:mb-4">
                  {question.subtitle}
                </p>
              )}

              {question.context && (
                <p className="text-sm sm:text-base text-white/60 italic mb-6 sm:mb-8">
                  Why this matters: {question.context}
                </p>
              )}

              <div className="mt-6 sm:mt-8">
                <div className="space-y-2 sm:space-y-3">
                  {question.options.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleOptionSelect(question.id, option.value)}
                      className={`w-full text-left px-4 sm:px-6 py-3 sm:py-5 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 sm:gap-4 group ${
                        currentValue === option.value
                          ? "bg-white text-gray-900 border-white shadow-lg scale-[1.02]"
                          : "bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                      }`}
                    >
                      <span className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                        currentValue === option.value
                          ? "bg-emerald-500 text-white"
                          : "bg-white/20 text-white group-hover:bg-white/30"
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-sm sm:text-lg font-medium flex-1">
                        {option.label}
                      </span>
                      {currentValue === option.value && (
                        <Check className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!showResult) return null;

    const RiskIcon = risk.icon;
    const signals = deriveSignals(answers);
    const dimensions = deriveDimensions(signals);
    const { verdict } = decideVerdict(dimensions);
    const marginValue = currentMargin ? parseFloat(currentMargin) : 0;
    const marginImpact = marginValue > 0 ? calculateMarginImpact(verdict, marginValue, dimensions) : null;

    return (
      <div className="absolute inset-0 z-30 overflow-y-auto">
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <RiskIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              <span className="text-base sm:text-lg font-bold text-white">Margin Risk Profile</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
              {risk.label}
            </h2>

            <p className="text-gray-400 mb-8 max-w-lg mx-auto text-sm sm:text-base">
              {risk.level === "critical" && "High AI exposure combined with workforce intensity creates unsustainable cost pressure. This engagement requires repricing or structural changes before commitment."}
              {risk.level === "high" && "Multiple high-risk signals detected. Structural overload likely — senior involvement and volatility create unsustainable margin pressure."}
              {risk.level === "elevated" && "Elevated risk indicators present. Execution demands or AI oversight burden will dominate effort and may erode margins without careful management."}
              {risk.level === "moderate" && "Some risk signals present. Pricing assumptions may need protection to preserve margins."}
              {risk.level === "low" && "No high-risk conditions triggered. Engagement appears viable under stated assumptions."}
            </p>

            {marginImpact && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 mb-8 text-left">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">Estimated Margin Impact</h3>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-500 mb-1">Current Margin</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{marginImpact.estimatedLoss > 0 ? marginValue : marginValue}%</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-500 mb-1">Est. Margin Loss</p>
                    <p className={`text-xl sm:text-2xl font-bold ${marginImpact.impactColor === "emerald" ? "text-emerald-400" : marginImpact.impactColor === "amber" ? "text-amber-400" : "text-red-400"}`}>
                      {marginImpact.estimatedLoss > 0 ? `-${marginImpact.estimatedLoss}%` : "0%"}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-500 mb-1">Effective Margin</p>
                    <p className={`text-xl sm:text-2xl font-bold ${marginImpact.effectiveMargin >= marginValue * 0.7 ? "text-emerald-400" : marginImpact.effectiveMargin >= marginValue * 0.5 ? "text-amber-400" : "text-red-400"}`}>
                      {marginImpact.effectiveMargin}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                    marginImpact.impactColor === "emerald" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                    marginImpact.impactColor === "amber" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                    "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}>
                    {marginImpact.impactLabel}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-8 max-w-md sm:max-w-xl mx-auto">
              {profilerQuestions.map((q) => {
                const answer = answers[q.id];
                const riskLevel = answer ? q.riskMapping[answer] : null;
                return (
                  <div key={q.id} className="flex flex-col items-center gap-1">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${riskLevel ? `${getHeatmapColor(riskLevel)} text-white ${getHeatmapGlow(riskLevel)}` : 'bg-white/10 text-white/40'}`}>
                      Q{q.number}
                    </div>
                    <span className="text-xs text-gray-500">
                      {riskLevel === "high" ? "High" : riskLevel === "medium" ? "Med" : "Low"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 mb-8 text-left">
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                {risk.level === "critical" || risk.level === "high"
                  ? "This quick profile indicates significant margin risk. A full assessment will provide detailed dimension analysis, effort allocation recommendations, and a Decision Memo."
                  : risk.level === "elevated" || risk.level === "moderate"
                  ? "Some risk signals are present. A full assessment will break down each risk dimension and provide actionable recommendations to protect your margins."
                  : "Your initial profile looks positive. A full assessment will validate this across all risk dimensions and provide a comprehensive Decision Memo."}
              </p>
            </div>

            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-4 sm:py-5 px-8 sm:px-10 text-base sm:text-lg shadow-lg rounded-xl flex flex-col h-auto gap-1 items-center"
              onClick={handleGoToFullAssessment}
            >
              <span className="flex items-center gap-2">
                Continue to Paid Assessment @ $89
                <ChevronRight className="h-5 w-5" />
              </span>
              <span className="text-xs text-emerald-100 font-normal">Payment at Submission</span>
            </Button>

            <p className="text-xs text-gray-500 mt-4">
              Your answers carry forward — the full assessment will skip these questions.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative h-screen overflow-hidden bg-emerald-600">
      {renderIntro()}
      {renderMarginQuestion()}
      {profilerQuestions.map((_, index) => renderCard(index))}
      {renderResult()}

      <div className="fixed top-0 left-0 right-0 z-[100] bg-black/40 backdrop-blur-md" style={{ pointerEvents: 'auto' }}>
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:text-emerald-200 hover:bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="font-bold hidden sm:inline">MarginMix</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {!isIntro && (
              <>
                {renderHeatmap()}
                <div className="hidden sm:block">
                  {renderRiskBadge()}
                </div>
                <span className="text-xs sm:text-sm text-white/80 font-medium">
                  {showResult ? "Result" : isMarginQuestion ? "Margin" : `${currentQuestion + 1}/${totalQuestions}`}
                </span>
                <div className="w-12 sm:w-20 md:w-24">
                  <Progress value={calculateProgress()} className="h-1.5 bg-white/20" />
                </div>
                <Link href="/">
                  <Button
                    variant="ghost"
                    className="text-white hover:text-emerald-200 hover:bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2"
                  >
                    <Home className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Home</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {!isIntro && !isMarginQuestion && !showResult && (
        <div className="fixed bottom-4 sm:bottom-8 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 sm:px-6" style={{ pointerEvents: 'auto' }}>
          {currentQuestion >= 0 && currentQuestion <= 1 && (
            <div className="sm:hidden flex items-center gap-2 text-white/60 text-xs mb-1 animate-pulse">
              <ChevronDown className="h-3 w-3 rotate-180" />
              <span>Swipe up to continue</span>
              <ChevronDown className="h-3 w-3 rotate-180" />
            </div>
          )}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="sm:hidden">
              {renderRiskBadge()}
            </div>
          </div>
          <div className="flex justify-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentQuestion <= 0}
              className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
            >
              <ArrowUp className="mr-1 sm:mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
            >
              {currentQuestion === totalQuestions - 1 ? "See Result" : "Continue"}
              <ArrowDown className="ml-1 sm:ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
